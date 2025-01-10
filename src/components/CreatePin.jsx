import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { getAuth } from 'firebase/auth';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../app/globals.css';

export default function CreatePin() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = getAuth();

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      setDescription(editor.getHTML());
    },
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);

    // Preview images
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImages = async (files) => {
    const urls = [];
    for (const file of files) {
      const storageRef = ref(storage, `pins/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!auth.currentUser) {
        throw new Error('Please sign in to create a pin');
      }

      if (!title || !description || imageFiles.length === 0) {
        throw new Error('Please fill in all fields and add at least one image');
      }

      // Upload images to Firebase Storage
      const imageUrls = await uploadImages(imageFiles);

      // Create pin with rich text and multiple images
      const response = await axios.post('http://10.0.0.23:5000/api/pins', {
        title,
        description,
        images: imageUrls,
        username: auth.currentUser.displayName,
        richText: editor.getJSON()
      });

      router.push(`/pin/${response.data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create Pin</h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-lg"
            placeholder="Add your title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <EditorContent 
            editor={editor} 
            className="prose max-w-none border rounded-lg p-4 min-h-[200px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="mb-4"
          />
          
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={img}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImages(images.filter((_, i) => i !== index));
                      setImageFiles(Array.from(imageFiles).filter((_, i) => i !== index));
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                  >
                    <XMarkIcon className="w-4 h-4text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {loading ? 'Creating...' : 'Create Pin'}
        </button>
      </form>
    </div>
  );
} 