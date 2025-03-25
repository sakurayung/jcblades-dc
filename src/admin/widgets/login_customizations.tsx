import { useEffect } from 'react';
import { defineWidgetConfig } from "@medusajs/admin-sdk";
const LoginCustomizationsWidget = () => {
    useEffect(() => {
        // remove logo
        document.querySelectorAll('.mb-large').forEach((DOMnode) => DOMnode.remove())
    }, [])
    
    return (            
            <p className="text-center">JC Blades Davao City</p>
    )
}

export const config = defineWidgetConfig({
    zone: 'login.before',
});


export default LoginCustomizationsWidget