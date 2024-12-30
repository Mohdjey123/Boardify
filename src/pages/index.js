import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [pins, setPins] = useState([]);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/pins'); 
        setPins(response.data);
      } catch (error) {
        console.error('Error fetching pins:', error);
      }
    };

    fetchPins();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {pins.map((pin) => (
        <div key={pin.id} className="border p-4 rounded shadow">
          <img
            src={pin.image_url}
            alt={pin.title}
            className="w-full h-64 object-cover mb-4"
          />
          <h2 className="text-xl font-bold mb-2">{pin.title}</h2>
          <p>{pin.description}</p>
        </div>
      ))}
    </div>
  );
}
