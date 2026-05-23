
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


email="sh.mahin.2003@gmail.com"
password="xpwi qawd yqud iala"

options = webdriver.EdgeOptions()
options.add_experimental_option("detach", True)


service_obj = Service()
driver = webdriver.Edge(options=options, service=service_obj)
driver.get("http://localhost:3000/email")
email_input = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=email]"))
        )
email_input.send_keys(email)

submit_button = driver.find_element(By.CSS_SELECTOR, "button[type=submit]")
submit_button.click()

WebDriverWait(driver, 15).until(EC.url_contains("/password"))
assert "/password" in driver.current_url

WebDriverWait(driver, 20).until(EC.url_contains("/password"))

password_input = WebDriverWait(driver, 20).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=password]"))
)
password_input.clear()
password_input.send_keys(password)
driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()

WebDriverWait(driver, 30).until(EC.url_to_be("http://localhost:3000/"))