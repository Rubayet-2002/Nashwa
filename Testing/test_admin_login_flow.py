
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


driver.get("http://localhost:3000/admin/login")
admin_key_input = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=admin_key]"))
        )
admin_email_input = driver.find_element(By.CSS_SELECTOR, "input[name=admin_email]")
password_input = driver.find_element(By.CSS_SELECTOR, "input[name=password]")

admin_key_input.send_keys("invalid-key")
admin_email_input.send_keys("admin@example.com")
password_input.send_keys("WrongPassword")

submit_button = driver.find_element(By.CSS_SELECTOR, "button[type=submit]")
submit_button.click()

WebDriverWait(driver, 15).until(EC.url_contains("/admin/login"))
assert "/admin/login" in driver.current_url

