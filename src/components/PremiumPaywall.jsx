export default function PremiumPaywall({ onClose, onActivate }) {
    return (
      <div className="paywall-overlay">
        <div className="paywall-content">
          <h2>Получите Премиум!</h2>
          <p>Разблокируйте неограниченное количество заметок и другие функции.</p>
          <button onClick={onActivate}>Активировать Премиум</button>
          <button onClick={onClose}>Отмена</button>
        </div>
      </div>
    );
  }
  