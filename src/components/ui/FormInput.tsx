interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function FormInput({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange,
  disabled = false 
}: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder={`Enter your ${label.toLowerCase()}`}
        required
      />
    </div>
  );
}