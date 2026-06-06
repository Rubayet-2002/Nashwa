import time
from time import sleep

from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = "http://localhost:3000"
EMAIL = "sh.mahin.2003@gmail.com"
PASSWORD = "password123"

options = webdriver.EdgeOptions()
options.add_experimental_option("detach", True)
service_obj = Service()


def login(driver):
    driver.get(f"{BASE_URL}/email")
    email_input = WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=email]"))
    )
    email_input.clear()
    email_input.send_keys(EMAIL)
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()

    WebDriverWait(driver, 20).until(EC.url_contains("/password"))
    password_input = WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=password]"))
    )
    password_input.clear()
    password_input.send_keys(PASSWORD)
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    WebDriverWait(driver, 30).until(EC.url_to_be(f"{BASE_URL}/"))


def test_edit_profile_flow():
    driver = webdriver.Edge(options=options, service=service_obj)
    try:
        login(driver)
        driver.get(f"{BASE_URL}/profile")

        settings_tab = WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Account & Settings')]"))
        )
        settings_tab.click()

        username_input = WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='username'], input[placeholder='Username']"))
        )
        phone_input = driver.find_element(By.CSS_SELECTOR, "input[name='phone'], input[placeholder='Phone number']")
        save_button = driver.find_element(By.XPATH, "//button[normalize-space()='Save details']")

        new_username = "SH Mahin"
        username_input.clear()
        username_input.send_keys(new_username)
        phone_input.clear()
        phone_input.send_keys("+8801700000000")
        save_button.click()

        WebDriverWait(driver, 30).until(
            EC.text_to_be_present_in_element((By.XPATH, "//h2[contains(., 'My info') ]"), "My info")
        )

        assert new_username in driver.page_source
    finally:
        sleep(20)
