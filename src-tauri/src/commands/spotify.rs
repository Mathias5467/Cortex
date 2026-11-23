use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use serde::Serialize;
use std::time::{SystemTime, UNIX_EPOCH};
use windows::core::Result as WinResult;
use windows::Foundation::{DateTime, TimeSpan};
use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSession as Session,
    GlobalSystemMediaTransportControlsSessionManager as SessionManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus as PlaybackStatus,
};
use windows::Media::MediaPlaybackAutoRepeatMode as RepeatMode;
use windows::Storage::Streams::DataReader;

const TICKS_PER_MS: i64 = 10_000;
const EPOCH_OFFSET_MS: i64 = 11_644_473_600_000;

#[derive(Serialize)]
pub struct NowPlaying {
    title: String,
    artist: String,
    album: String,
    is_playing: bool,
    position_ms: i64,
    duration_ms: i64,
    shuffle: Option<bool>,
    repeat: Option<&'static str>,
}

fn find_session() -> WinResult<Option<Session>> {
    let sessions = SessionManager::RequestAsync()?.get()?.GetSessions()?;
    for session in sessions {
        let app_id = session.SourceAppUserModelId()?.to_string().to_lowercase();
        if app_id.contains("spotify") {
            return Ok(Some(session));
        }
    }
    Ok(None)
}

fn span_ms(span: TimeSpan) -> i64 {
    span.Duration / TICKS_PER_MS
}

fn elapsed_since(time: DateTime) -> i64 {
    if time.UniversalTime <= 0 {
        return 0;
    }
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;
    (now + EPOCH_OFFSET_MS - time.UniversalTime / TICKS_PER_MS).max(0)
}

fn repeat_name(mode: RepeatMode) -> &'static str {
    match mode {
        RepeatMode::Track => "track",
        RepeatMode::List => "list",
        _ => "none",
    }
}

fn next_repeat(mode: RepeatMode) -> RepeatMode {
    match mode {
        RepeatMode::None => RepeatMode::List,
        RepeatMode::List => RepeatMode::Track,
        _ => RepeatMode::None,
    }
}

fn read_now_playing(session: &Session) -> WinResult<NowPlaying> {
    let media = session.TryGetMediaPropertiesAsync()?.get()?;
    let playback = session.GetPlaybackInfo()?;
    let timeline = session.GetTimelineProperties()?;

    let is_playing = playback.PlaybackStatus()? == PlaybackStatus::Playing;
    let duration_ms = span_ms(timeline.EndTime()?);
    let elapsed = if is_playing {
        elapsed_since(timeline.LastUpdatedTime()?)
    } else {
        0
    };

    Ok(NowPlaying {
        title: media.Title()?.to_string(),
        artist: media.Artist()?.to_string(),
        album: media.AlbumTitle()?.to_string(),
        is_playing,
        position_ms: (span_ms(timeline.Position()?) + elapsed).min(duration_ms),
        duration_ms,
        shuffle: playback
            .IsShuffleActive()
            .and_then(|value| value.Value())
            .ok(),
        repeat: playback
            .AutoRepeatMode()
            .and_then(|value| value.Value())
            .map(repeat_name)
            .ok(),
    })
}

fn read_artwork(session: &Session) -> WinResult<String> {
    let stream = session
        .TryGetMediaPropertiesAsync()?
        .get()?
        .Thumbnail()?
        .OpenReadAsync()?
        .get()?;
    let size = stream.Size()? as u32;
    let reader = DataReader::CreateDataReader(&stream)?;
    reader.LoadAsync(size)?.get()?;

    let mut bytes = vec![0u8; size as usize];
    reader.ReadBytes(&mut bytes)?;

    let content_type = stream.ContentType()?.to_string();
    let mime = if content_type.starts_with("image/") {
        content_type
    } else {
        "image/png".to_string()
    };
    Ok(format!("data:{mime};base64,{}", BASE64.encode(bytes)))
}

fn send_control(session: &Session, action: &str, position_ms: Option<i64>) -> WinResult<bool> {
    match action {
        "toggle" => session.TryTogglePlayPauseAsync()?.get(),
        "next" => session.TrySkipNextAsync()?.get(),
        "previous" => session.TrySkipPreviousAsync()?.get(),
        "shuffle" => {
            let active = session.GetPlaybackInfo()?.IsShuffleActive()?.Value()?;
            session.TryChangeShuffleActiveAsync(!active)?.get()
        }
        "repeat" => {
            let mode = session.GetPlaybackInfo()?.AutoRepeatMode()?.Value()?;
            session
                .TryChangeAutoRepeatModeAsync(next_repeat(mode))?
                .get()
        }
        "seek" => session
            .TryChangePlaybackPositionAsync(position_ms.unwrap_or(0) * TICKS_PER_MS)?
            .get(),
        _ => Ok(false),
    }
}

#[tauri::command(async)]
pub fn spotify_now_playing() -> Result<Option<NowPlaying>, String> {
    let Some(session) = find_session().map_err(|e| e.message())? else {
        return Ok(None);
    };
    read_now_playing(&session)
        .map(Some)
        .map_err(|e| e.message())
}

#[tauri::command(async)]
pub fn spotify_artwork() -> Option<String> {
    let session = find_session().ok()??;
    read_artwork(&session).ok()
}

#[tauri::command(async)]
pub fn spotify_control(action: String, position_ms: Option<i64>) -> Result<(), String> {
    let session = find_session()
        .map_err(|e| e.message())?
        .ok_or("Spotify is not running")?;

    match send_control(&session, &action, position_ms) {
        Ok(true) => Ok(()),
        Ok(false) => Err("Spotify did not accept the action".to_string()),
        Err(e) => Err(e.message()),
    }
}
