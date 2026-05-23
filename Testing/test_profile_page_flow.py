
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
import time

def random_email():
    return f"user_{int(time.time())}@example.com"

email="sh.mahin.2003@gmail.com"
password="xpwi qawd yqud iala"

options = webdriver.EdgeOptions()
options.add_experimental_option("detach", True)


service_obj = Service()
driver = webdriver.Edge(options=options, service=service_obj)

def test_profile_page_is_available_after_login():

    email ="sh.mahin.2002@gmail.com"
    password = "Password123"


    try:
        driver.get("http://localhost:3000/email")
        email_input = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=email]"))
        )
        email_input.send_keys(email)

        submit_button = driver.find_element(By.CSS_SELECTOR, "button[type=submit]")
        submit_button.click()

        WebDriverWait(driver, 15).until(EC.url_contains("/password"))

        password_input = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=password]"))
        )
        password_input.send_keys(password)
        submit_button = driver.find_element(By.CSS_SELECTOR, "button[type=submit]")
        submit_button.click()

        WebDriverWait(driver, 15).until(EC.url_to_be("http://localhost:3000/"))

        driver.get("http://localhost:3000/profile")
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.XPATH, "//p[contains(text(),'My info')]"))
        )

        assert driver.find_element(By.XPATH, "//p[contains(text(),'My info')]").is_displayed()
    finally:
        driver.quit()
