import { useCallback, lazy, Suspense } from 'react';

const ReactQuill = lazy(() => import('react-quill'));

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const handleChange = useCallback((content: string) => {
    onChange(content);
  }, [onChange]);

  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        modules={{
          toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
          ],
        }}
      />
    </Suspense>
  );
} 