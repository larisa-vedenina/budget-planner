import React, { useState } from 'react'; 

export const LoginPage = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Реализовать логику входа
    console.log("Login attempt:", { login, password });
  };

  return (
    <><div
      style={{
        background: "#CAEEFC",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "-2px 2px 1px rgba(0, 0, 0, 0.25)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Вход</h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <input
            type="text"
            placeholder="Логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            style={{
              padding: "15px",
              border: "3px solid #D87B7B",
              borderRadius: "10px",
              fontSize: "18px",
            }} />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "15px",
              border: "3px solid #D87B7B",
              borderRadius: "10px",
              fontSize: "18px",
            }} />

          <button
            type="submit"
            style={{
              padding: "15px",
              background: "#FFFFFF",
              border: "4px solid #507B5D",
              borderRadius: "10px",
              boxShadow: "-2px 2px 1px rgba(0, 0, 0, 0.25)",
              color: "#0D0D0D",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            ВОЙТИ
          </button>
        </form>
      </div>
    </div><div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => window.location.href = '/start'}>Start</button>
        <button onClick={() => window.location.href = '/form'}>Form</button>
        <button onClick={() => window.location.href = '/login'}>Login</button>
        <button onClick={() => window.location.href = '/archive'}>Archive</button>
        <button onClick={() => window.location.href = '/main'}>Main</button>
      </div></>
  );
};
