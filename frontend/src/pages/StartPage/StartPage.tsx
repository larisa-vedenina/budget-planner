export const StartPage = () => {
  return (
    <>
      <div
        style={{
          background: "#CAEEFC",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "start",
          padding: "50px 20px",
        }}
      >
        {/* Логотип */}
        <div
          style={{
            fontSize: "28px",
            marginBottom: "260px",
            color: "#5B5B5B",
            fontFamily: "Roboto Condensed, sans-serif",
          }}
        >
          Твой ии бюджет
        </div>

        {/* Кнопки */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            width: "100%",
            maxWidth: "342px",
          }}
        >
          <button
            style={{
              width: "342px",
              height: "63px",
              background: "#FFFFFF",
              border: "4px solid #D87B7B",
              borderRadius: "10px",
              boxShadow: "-2px 2px 1px rgba(0, 0, 0, 0.25)",
              color: "#0D0D0D",
              fontSize: "24px",
              cursor: "pointer",
            }}
            onClick={() => (window.location.href = "/form")}
          >
            СОЗДАТЬ НОВЫЙ БЮДЖЕТ
          </button>

          <button
            style={{
              width: "342px",
              height: "63px",
              background: "#FFFFFF",
              border: "4px solid #69B5D3",
              borderRadius: "10px",
              boxShadow: "-2px 2px 1px rgba(0, 0, 0, 0.25)",
              color: "#0D0D0D",
              fontSize: "24px",
              cursor: "pointer",
            }}
            onClick={() => (window.location.href = "/login")}
          >
            ВОЙТИ В ЛИЧНЫЙ КАБИНЕТ
          </button>
        </div>
      </div>
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={() => (window.location.href = "/start")}>Start</button>
        <button onClick={() => (window.location.href = "/form")}>Form</button>
        <button onClick={() => (window.location.href = "/login")}>Login</button>
        <button onClick={() => (window.location.href = "/archive")}>
          Archive
        </button>
        <button onClick={() => (window.location.href = "/main")}>Main</button>
      </div>
    </>
  );
};
