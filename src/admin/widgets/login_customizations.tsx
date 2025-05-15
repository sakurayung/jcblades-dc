import { useEffect } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
const LoginCustomizationsWidget = () => {
  useEffect(() => {
    const welcomeDiv = document.querySelector("div.mb-4.flex.flex-col.items-center");
    if (welcomeDiv) {
        const headerElement = welcomeDiv.querySelector("h1");
        const paragraphElement = welcomeDiv.querySelector("p");
        if (headerElement) {
            headerElement.textContent = "JC Blades Davao City";
            headerElement.style.textAlign = "center";
        }

        if (paragraphElement) {
            paragraphElement.textContent = "Sign in to access your admin dashboard";
            paragraphElement.style.textAlign = "center";
        }

        welcomeDiv.classList.add("text-center");
    }
    
  }, []);

  return (
    <>
    </>
  )
};

export const config = defineWidgetConfig({
  zone: "login.before",
});

export default LoginCustomizationsWidget;
