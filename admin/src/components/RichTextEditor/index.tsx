import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  return (
    <div className="rich-text-editor">
      <CKEditor
        editor={ClassicEditor}
        data={value || ''}
        onChange={(_, editor) => {
          const data = editor.getData();
          onChange?.(data);
        }}
        config={{
          toolbar: [
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            'bulletedList',
            'numberedList',
            '|',
            'link',
            'blockQuote',
            'undo',
            'redo',
          ],
        }}
      />
    </div>
  );
}

