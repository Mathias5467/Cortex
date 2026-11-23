use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use pbkdf2::pbkdf2_hmac;
use rand::RngCore;
use sha2::Sha256;

const PBKDF2_ROUNDS: u32 = 100_000;

pub fn derive_key(master_password: &str, salt: &[u8]) -> [u8; 32] {
    let mut key = [0u8; 32];
    pbkdf2_hmac::<Sha256>(
        master_password.as_bytes(),
        salt,
        PBKDF2_ROUNDS,
        &mut key,
    );
    key
}

pub fn encrypt_secret(plain_text: &str, key: &[u8; 32]) -> Result<(String, String), String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;

    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plain_text.as_bytes())
        .map_err(|e| e.to_string())?;

    Ok((BASE64.encode(ciphertext), BASE64.encode(nonce_bytes)))
}

pub fn decrypt_secret(
    ciphertext_base64: &str,
    nonce_base64: &str,
    key: &[u8; 32],
) -> Result<String, String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;

    let ciphertext = BASE64
        .decode(ciphertext_base64)
        .map_err(|e| e.to_string())?;
    let nonce_bytes = BASE64.decode(nonce_base64).map_err(|e| e.to_string())?;

    if nonce_bytes.len() != 12 {
        return Err("Invalid nonce length".to_string());
    }

    let nonce = Nonce::from_slice(&nonce_bytes);
    let decrypted_bytes = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| "Decryption failed (Wrong password or corrupted data)".to_string())?;

    String::from_utf8(decrypted_bytes).map_err(|e| e.to_string())
}