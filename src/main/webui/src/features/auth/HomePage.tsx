import LoginForm from "@/features/auth/LoginForm.tsx";
import RegisterForm from "@/features/auth/RegisterForm.tsx";
import {useState} from "react";

export default function HomePage() {

    const [isRegister, setRegister] = useState(false);

    const formToDisplay = isRegister ? <RegisterForm onClick={() => setRegister(false)}/> :
        <LoginForm onClick={() => setRegister(true)}/>

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-screen bg-slate-800" style={{
            backgroundImage: `url(https://static.deckserver.net/assets/images/Locations52.jpg)`,
            backgroundSize: "cover"
        }}>
            {formToDisplay}
        </div>
    );
}