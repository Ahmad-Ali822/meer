use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;

const EXPECTED_USERNAME: &str = "musameer";
const PASSWORD_SALT: &[u8] = b"meer-ilyas-invoice-v1";
const EXPECTED_PASSWORD_DIGEST: [u8; 32] = [
    0x4f, 0xc9, 0xda, 0x2c, 0xb4, 0x8f, 0x29, 0x88, 0x10, 0x30, 0x21, 0xd4, 0x2f, 0x8e, 0x35, 0xdb,
    0xaf, 0x3b, 0x60, 0x2d, 0x2b, 0x38, 0xba, 0x89, 0x16, 0x1f, 0x46, 0x83, 0xbb, 0x8f, 0x86, 0xe5,
];

fn digest_password(password: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(PASSWORD_SALT);
    hasher.update(password.as_bytes());
    hasher.finalize().into()
}

pub fn verify_credentials(username: &str, password: &str) -> bool {
    if username != EXPECTED_USERNAME {
        return false;
    }

    digest_password(password)
        .ct_eq(&EXPECTED_PASSWORD_DIGEST)
        .into()
}
