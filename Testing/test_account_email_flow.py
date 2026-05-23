import random
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
import time


def random_email():
     return f"user_{int(time.time())}@example.com"

options = webdriver.EdgeOptions()
options.add_experimental_option("detach", True)


service_obj = Service()
driver = webdriver.Edge(options=options, service=service_obj)


driver.get("http://localhost:3000/email")
email_input = WebDriverWait(driver, 15).until(
EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=email]"))
)
email_input.send_keys(random_email())

submit_button = driver.find_element(By.CSS_SELECTOR, "button[type=submit]")
submit_button.click()

WebDriverWait(driver, 15).until(EC.url_contains("/registration"))
assert "/registration" in driver.current_url


