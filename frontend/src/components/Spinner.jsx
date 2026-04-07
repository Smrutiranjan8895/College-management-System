function Spinner({ size = 'medium' }) {
  const sizeClass = `spinner spinner--${size}`;
  
  return (
    <div className={sizeClass}>
      <div className="spinner__circle"></div>
    </div>
  );
}

export default Spinner;
