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


def test_feasts_events_flow():
    driver = webdriver.Edge(options=options, service=service_obj)
    try:
        login(driver)
        driver.get(f"{BASE_URL}/feasts-events")

        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Campus') and contains(., 'Feasts & Events')]"))
        )

        assert "Host an Event" in driver.page_source
    finally:
        sleep(5)
