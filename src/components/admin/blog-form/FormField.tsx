interface FormFieldProps {
  label: string;
  type?: 'text' | 'url' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export default function FormField({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder,
  className = ''
}: FormFieldProps) {
  const baseClasses = "w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent";
  
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClasses} ${type === 'textarea' ? 'h-64' : ''}`}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  );
}