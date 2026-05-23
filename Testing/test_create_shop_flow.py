
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


driver.get("http://localhost:3000/shop/create-shop")
WebDriverWait(driver, 15).until(EC.url_contains("/email"))
if "/email" in driver.current_url:
    print("You must login first, redirect to email page")
elif "/shop/create-shop" in driver.current_url:
    print("✅ Login ")
else:
    print("⚠ Unexpected error:")

