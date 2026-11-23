use crate::db::{with_db, DbState};
use crate::vault;
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use rand::RngCore;
use std::sync::Mutex;
use tauri::State;

#[derive(Default)]
pub struct VaultSession(Mutex<Option<[u8; 32]>>);

impl VaultSession {
    fn is_unlocked(&self) -> Result<bool, String> {
        Ok(self.0.lock().map_err(|e| e.to_string())?.is_some())
    }

    fn key(&self) -> Result<[u8; 32], String> {
        self.0
            .lock()
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Vault is locked".to_string())
    }

    fn set(&self, key: Option<[u8; 32]>) -> Result<(), String> {
        *self.0.lock().map_err(|e| e.to_string())? = key;
        Ok(())
    }
}

#[derive(serde::Serialize)]
pub struct VaultStatus {
    pub is_initialized: bool,
    pub is_unlocked: bool,
}

#[derive(serde::Serialize)]
pub struct DecryptedVaultEntry {
    pub id: i64,
    pub title: String,
    pub username: String,
    pub password: String,
    pub url: Option<String>,
    pub updated_at: i64,
}

fn derive_verifier(key: &[u8; 32]) -> [u8; 32] {
    vault::derive_key("cortex_verify_key", key)
}

#[tauri::command]
pub fn check_vault_status(
    db: DbState<'_>,
    session: State<'_, VaultSession>,
) -> Result<VaultStatus, String> {
    let settings = with_db(&db, |db| db.get_vault_settings())?;

    Ok(VaultStatus {
        is_initialized: settings.is_some(),
        is_unlocked: session.is_unlocked()?,
    })
}

#[tauri::command]
pub fn setup_master_password(
    password: String,
    db: DbState<'_>,
    session: State<'_, VaultSession>,
) -> Result<(), String> {
    let mut salt = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut salt);

    let key = vault::derive_key(&password, &salt);
    let verifier = derive_verifier(&key);

    with_db(&db, |db| {
        db.set_vault_settings(&BASE64.encode(salt), &BASE64.encode(verifier))
    })?;
    session.set(Some(key))
}

#[tauri::command]
pub fn unlock_vault(
    password: String,
    db: DbState<'_>,
    session: State<'_, VaultSession>,
) -> Result<bool, String> {
    let Some((salt, verifier)) = with_db(&db, |db| db.get_vault_settings())? else {
        return Ok(false);
    };

    let salt = BASE64.decode(salt).map_err(|e| e.to_string())?;
    let expected_verifier = BASE64.decode(verifier).map_err(|e| e.to_string())?;
    let key = vault::derive_key(&password, &salt);

    if derive_verifier(&key) != expected_verifier.as_slice() {
        return Ok(false);
    }

    session.set(Some(key))?;
    Ok(true)
}

#[tauri::command]
pub fn lock_vault(session: State<'_, VaultSession>) -> Result<(), String> {
    session.set(None)
}

#[tauri::command]
pub fn get_vault_entries(
    db: DbState<'_>,
    session: State<'_, VaultSession>,
) -> Result<Vec<DecryptedVaultEntry>, String> {
    let key = session.key()?;
    let entries = with_db(&db, |db| db.get_vault_entries())?;

    Ok(entries
        .into_iter()
        .map(|entry| DecryptedVaultEntry {
            password: vault::decrypt_secret(&entry.ciphertext, &entry.nonce, &key)
                .unwrap_or_else(|_| "••••••••".to_string()),
            id: entry.id,
            title: entry.title,
            username: entry.username,
            url: entry.url,
            updated_at: entry.updated_at,
        })
        .collect())
}

#[tauri::command]
pub fn save_vault_item(
    id: Option<i64>,
    title: String,
    username: String,
    password: String,
    url: Option<String>,
    db: DbState<'_>,
    session: State<'_, VaultSession>,
) -> Result<(), String> {
    let (ciphertext, nonce) = vault::encrypt_secret(&password, &session.key()?)?;

    with_db(&db, |db| {
        db.save_vault_entry(id, &title, &username, &ciphertext, &nonce, url.as_deref())
    })
}

#[tauri::command]
pub fn delete_vault_item(id: i64, db: DbState<'_>) -> Result<(), String> {
    with_db(&db, |db| db.delete_vault_entry(id))
}
