const APP_USERNAME: &str = "musameer";
const APP_PASSWORD: &str = "musa@123";

pub fn login(username: String, password: String) -> Result<bool, String> {
    let username_matches = username.trim().eq_ignore_ascii_case(APP_USERNAME);
    let password_matches = password == APP_PASSWORD;

    if username_matches && password_matches {
        Ok(true)
    } else {
        Err("Invalid username or password".to_string())
    }
}
