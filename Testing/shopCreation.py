import os
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait




options = webdriver.EdgeOptions()
options.add_experimental_option("detach", True)


service_obj = Service()
driver = webdriver.Edge(options=options, service=service_obj)


def test_shop_creation_form_fills_steps_and_reaches_file_upload():

    fixture_path = Path(__file__).resolve().parent / "fixtures" / "test_nid.pdf"
    email = "sh.mahin.2003@gmail.com"
    password = "xpwi qawd yqud iala"

    try:

        driver.get("http://localhost:3000/email")
        email_input = WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=email]"))
        )
        email_input.clear()
        email_input.send_keys(email)

        driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()

        WebDriverWait(driver, 20).until(EC.url_contains("/password"))

        password_input = WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=password]"))
        )
        password_input.clear()
        password_input.send_keys(password)
        driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()

        WebDriverWait(driver, 30).until(EC.url_to_be("http://localhost:3000/"))

        # Go to create shop page
        driver.get(
            "http://localhost:3000/shop/create-shop")
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=shopName]"))
        )

        shop_name = "Shopno"
        driver.find_element(By.CSS_SELECTOR, "input[name=shopName]").send_keys(shop_name)
        driver.find_element(By.CSS_SELECTOR, "input[name=shopEmail]").send_keys("shopno123@gmail.com")
        driver.find_element(By.CSS_SELECTOR, "input[name=shopPhone]").send_keys("01700003430")
        driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()

        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name=location]"))
        )
        driver.find_element(By.CSS_SELECTOR, "input[name=location]").send_keys(
            "Dhaka 1212,Cumilla,Uganda,"
        )
        driver.find_element(By.CSS_SELECTOR, "textarea[name=description]").send_keys(
            "This shop was created by Mahin for automation testing."
        )
        driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()


        file_input = WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type=file]#nid"))
        )
        assert file_input.is_displayed()


        assert fixture_path.exists(), f"Fixture file not found: {fixture_path}"
        file_input.send_keys(str(fixture_path))

        driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()

        WebDriverWait(driver, 60).until(EC.url_contains("/profile"))
        assert "/profile" in driver.current_url
    finally:
        driver.quit()
