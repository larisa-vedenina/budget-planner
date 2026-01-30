export const FormPage = () => {
  return (
    <><div style={{ padding: "20px" }}>
      <h1>Форма данных бюджета</h1>
      <p>Здесь будет форма для ввода данных...</p>
      <button onClick={() => (window.location.href = "/main")}>
        Создать план моего бюджета
      </button>
    </div><div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => window.location.href = '/start'}>Start</button>
        <button onClick={() => window.location.href = '/form'}>Form</button>
        <button onClick={() => window.location.href = '/login'}>Login</button>
        <button onClick={() => window.location.href = '/archive'}>Archive</button>
        <button onClick={() => window.location.href = '/main'}>Main</button>
      </div></>
  );
};

