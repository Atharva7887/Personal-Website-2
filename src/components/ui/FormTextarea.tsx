interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function FormTextarea({ label, name, value, onChange }: FormTextareaProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32"
        placeholder={`Your ${label}`}
        required
      />
    </div>
  );
}