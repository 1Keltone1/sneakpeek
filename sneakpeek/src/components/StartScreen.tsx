import { SHOES, type ShoeConfig } from '../config/shoes';
import './StartScreen.css';

interface StartScreenProps {
  onSelect: (shoe: ShoeConfig) => void;
}

export function StartScreen({ onSelect }: StartScreenProps) {
  return (
    <div className="start-screen">
      <div className="start-header">
        <h1>SneakPeek</h1>
        <p>How does it look?</p>
      </div>

      <details className="how-it-works">
        <summary>Как это работает?</summary>
        <div className="how-it-works-content">
          <p><strong>Выберите нужную модель обуви.</strong> Затем зафиксируйте устройство и нажмите кнопку «Сделать скриншоты».</p>
          <p>Начнется обратный отсчет (5 секунд) — за это время вам нужно отойти от устройства так, чтобы вы целиком поместились в кадр.</p>
          <p>Первый снимок будет сделан в положении <strong>прямо</strong>. Затем повернитесь на 90 градусов <strong>влево</strong> и дождитесь второго снимка. После этого повернитесь <strong>вправо</strong> и дождитесь окончания отсчета.</p>
          <p>Когда все три фотографии будут готовы, вы сможете скачать их и посмотреть результат.</p>
        </div>
      </details>

      <div className="shoe-grid">
        {SHOES.map((shoe) => {
          // Формируем правильный путь (учитывает BASE_URL для GitHub Pages)
          const imageUrl = `${import.meta.env.BASE_URL}${shoe.image}`;

          return (
            <button
              key={shoe.id}
              className="shoe-card"
              onClick={() => onSelect(shoe)}
            >
              <div className="shoe-image-container">
                <img 
                  src={imageUrl} 
                  alt={shoe.name} 
                  className="shoe-image"
                />
              </div>
              <div className="shoe-info">
                <span className="shoe-brand">{shoe.brand}</span>
                <span className="shoe-name">{shoe.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}