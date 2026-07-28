use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;

const EXPECTED_USERNAME: &str = "musameer";
const PASSWORD_SALT: &[u8] = b"meer-ilyas-invoice-v1";
const EXPECTED_PASSWORD_DIGEST: [u8; 32] = [
    0xe9, 0x87, 0xf1, 0xa3, 0x98, 0xb5, 0xa8, 0xb5, 0x65, 0xa4, 0x86, 0xb7, 0xc3, 0x96, 0xc1,
    0x23, 0x6a, 0x42, 0x75, 0xc0, 0xb8, 0x2d, 0xd5, 0x90, 0x26, 0x18, 0x91, 0x4f, 0x91, 0x62,
    0x16, 0xf0,
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

    digest_password(password).ct_eq(&EXPECTED_PASSWORD_DIGEST).into()
}
