import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Wrench } from 'lucide-react';

const DuelExercise = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        До вибору вправ
      </button>

      <div className="glass-card p-12 text-center animate-fade-in-up">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Users size={40} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Швидкочитання Дуель</h2>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Wrench size={16} className="text-accent" />
          <span className="text-accent font-medium text-sm">В розробці</span>
        </div>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Режим дуелі між двома гравцями в реальному часі незабаром буде доступний.
          Змагайтесь із другом дистанційно!
        </p>
      </div>
    </div>
  );
};

export default DuelExercise;
