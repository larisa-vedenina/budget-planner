export const ArchivePage = () => {
  return (
    <><div style={{ padding: "20px" }}>
      <h1>Архив бюджетов</h1>
      <p>Здесь будет список сохраненных периодов...</p>
      <button onClick={() => (window.location.href = "/form")}>
        Создать новый
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
