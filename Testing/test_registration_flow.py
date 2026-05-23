from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait




options = webdriver.EdgeOptions()
options.add_experimental_option("detach", True)


service_obj = Service()
driver = webdriver.Edge(options=options, service=service_obj)



email ="mmahin2330299@bscse.uiu.ac.bd"

driver.get("http://localhost:3000/email")
email_input = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=email]"))
        )
email_input.send_keys(email)

submit_button = driver.find_element(By.CSS_SELECTOR, "button[type=submit]")
submit_button.click()

WebDriverWait(driver, 15).until(EC.url_contains("/registration"))

username_input = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=username]"))
        )
password_input = driver.find_element(By.CSS_SELECTOR, "input[name=password]")

username_input.send_keys("Mahin")
password_input.send_keys("Password123")

submit_button = driver.find_element(By.CSS_SELECTOR, "button[type=submit]")
submit_button.click()

WebDriverWait(driver, 15).until(EC.url_contains("/otp-verification"))
assert "/otp-verification" in driver.current_url
print("success")
