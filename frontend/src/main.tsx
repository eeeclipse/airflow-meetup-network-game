import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import App from "./App.tsx";
import { airflowTheme } from "./theme/airflow";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={airflowTheme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
