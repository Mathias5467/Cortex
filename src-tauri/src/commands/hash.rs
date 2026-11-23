use md5::Md5;
use serde::Serialize;
use sha1::Sha1;
use sha2::{Digest, Sha256, Sha512};
use std::fs::File;
use std::io::{BufReader, Read};

const CHUNK_SIZE: usize = 1024 * 1024;

#[derive(Serialize)]
pub struct Digests {
    md5: String,
    sha1: String,
    sha256: String,
    sha512: String,
}

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn digest_reader(mut reader: impl Read) -> std::io::Result<Digests> {
    let mut md5 = Md5::new();
    let mut sha1 = Sha1::new();
    let mut sha256 = Sha256::new();
    let mut sha512 = Sha512::new();
    let mut buffer = vec![0u8; CHUNK_SIZE];

    loop {
        let read = reader.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        let chunk = &buffer[..read];
        md5.update(chunk);
        sha1.update(chunk);
        sha256.update(chunk);
        sha512.update(chunk);
    }

    Ok(Digests {
        md5: to_hex(&md5.finalize()),
        sha1: to_hex(&sha1.finalize()),
        sha256: to_hex(&sha256.finalize()),
        sha512: to_hex(&sha512.finalize()),
    })
}

#[tauri::command(async)]
pub fn hash_text(text: String) -> Result<Digests, String> {
    digest_reader(text.as_bytes()).map_err(|e| e.to_string())
}

#[tauri::command(async)]
pub fn hash_file(path: String) -> Result<Digests, String> {
    let file = File::open(path).map_err(|e| e.to_string())?;
    digest_reader(BufReader::new(file)).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_known_vectors() {
        let digests = digest_reader("abc".as_bytes()).unwrap();
        assert_eq!(digests.md5, "900150983cd24fb0d6963f7d28e17f72");
        assert_eq!(digests.sha1, "a9993e364706816aba3e25717850c26c9cd0d89d");
        assert_eq!(
            digests.sha256,
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
        assert!(digests.sha512.starts_with("ddaf35a193617abacc417349ae204131"));
    }
}
