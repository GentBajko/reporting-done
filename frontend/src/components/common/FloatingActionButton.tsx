import React from 'react';
import { HiPlus } from 'react-icons/hi';

interface FloatingActionButtonProps {
  onClick: () => void;
  title?: string;
  icon?: React.ElementType;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  title = "Create New", 
  icon: Icon = HiPlus 
}) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 p-4 bg-[#002F41] text-white rounded-full shadow-lg hover:bg-[#004057] hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center"
      aria-label={title}
      title={title}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
};

export default FloatingActionButton;

