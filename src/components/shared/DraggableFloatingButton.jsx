import { useState, useEffect, useRef } from 'react';

export default function DraggableFloatingButton({ 
  children, 
  storageKey, 
  defaultPosition = { bottom: 24, right: 24 },
  zIndex = 40 
}) {
  // Convert bottom/right to top/left for easier dragging
  const convertToTopLeft = (pos) => {
    if (pos.top !== undefined && pos.left !== undefined) {
      return pos; // Already in top/left format
    }
    // Convert from bottom/right to top/left
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    return {
      top: viewportHeight - pos.bottom - 56, // 56 = button height
      left: viewportWidth - pos.right - 56,   // 56 = button width
    };
  };

  const [position, setPosition] = useState(() => convertToTopLeft(defaultPosition));
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const savedPos = JSON.parse(saved);
        setPosition(convertToTopLeft(savedPos));
      } catch (e) {
        console.error('Failed to load button position:', e);
      }
    }
  }, [storageKey]);

  // Save position to localStorage
  const savePosition = (newPos) => {
    localStorage.setItem(storageKey, JSON.stringify(newPos));
    setPosition(newPos);
  };

  // Handle drag start (mouse and touch)
  const handleDragStart = (e) => {
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    const rect = buttonRef.current.getBoundingClientRect();
    
    setOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
    
    setStartPos({ x: clientX, y: clientY });
    setHasMoved(false);
    setIsDragging(true);
  };

  // Handle drag move
  const handleDragMove = (e) => {
    if (!isDragging) return;

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    // Calculate distance moved
    const deltaX = Math.abs(clientX - startPos.x);
    const deltaY = Math.abs(clientY - startPos.y);
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If moved more than 10px, it's a drag
    if (totalMovement > 10) {
      e.preventDefault();
      e.stopPropagation();
      setHasMoved(true);

      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate new position based on touch/mouse position
      let newLeft = clientX - offset.x;
      let newTop = clientY - offset.y;

      // Constrain to viewport (with 8px padding)
      const padding = 8;
      newLeft = Math.max(padding, Math.min(viewportWidth - rect.width - padding, newLeft));
      newTop = Math.max(padding, Math.min(viewportHeight - rect.height - padding, newTop));

      savePosition({ top: newTop, left: newLeft });
    }
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    setIsDragging(false);
    
    // If we didn't move much, it was a tap - let the click through
    if (!hasMoved) {
      // Allow the button's onClick to fire naturally
      // Don't prevent default - let it bubble to the button
    } else {
      // It was a drag, prevent click
      e.preventDefault();
      e.stopPropagation();
    }
    
    setHasMoved(false);
  };

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => handleDragMove(e);
      const handleEnd = (e) => handleDragEnd(e);
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);

      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, offset]);

  return (
    <div
      ref={buttonRef}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: zIndex,
        cursor: hasMoved ? 'grabbing' : 'grab',
        touchAction: 'none',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        willChange: 'transform',
        transform: 'translate3d(0, 0, 0)', // Force hardware acceleration
        pointerEvents: 'auto',
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      className={`select-none ${hasMoved ? 'scale-110' : ''}`}
    >
      {children}
    </div>
  );
}