
type Props = {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
};

export default function TextInput({ label, type = "text", placeholder, value, onChange, required = false }: Props) {
  return (
    <label className="flex flex-col">
      {label && <span className="text-sm font-medium text-gray-700 mb-1">{label}{required ? " *" : ""}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
      />
    </label>
  );
}

