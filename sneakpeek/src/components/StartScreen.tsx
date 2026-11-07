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