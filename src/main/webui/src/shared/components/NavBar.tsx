import {useNavigate} from "react-router-dom";
import API from "../../features/auth/api.ts";

export default function NavBar() {
    const navigate = useNavigate();

    async function handleLogout(): Promise<void> {
        await API.logout();
        navigate("/login");
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-12 bg-slate-900">
            <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                <button onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
}