import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image'
;
import { Inter } from 'next/font/google'
;

const inter = Inter({ subsets: ['latin'] })

const apiKey = process.env.API_KEY; // causes hyrdation error // WTF // just hardcode your API KEY to test

// Recipes brain id
// ba148110-669a-9b0a-773c-0ead70baa917
// Beef tag thought id
// e36b99cc-b89e-d17b-30ca-00e1a0fc5515

const server = 'https://api.bra.in';

export default function Home() {
  //const [brainId, setBrainId] = useState('');
  //const brainId = 'a8d27c08-6c5a-4be6-9940-704199356ef2';
  const brainId = 'ba148110-669a-9b0a-773c-0ead70baa917';
  //const [sourceThoughtId, setSourceThoughtId] = useState('');
  const sourceThoughtId = 'e36b99cc-b89e-d17b-30ca-00e1a0fc5515';
  //const [newThoughtName, setNewThoughtName] = useState('');
  //const [newThoughtLabel, setNewThoughtLabel] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState('');
  const [items, setItems] = useState([]);

  const isGuid = (value) => {
    const guidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return guidPattern.test(value);
  };

  const getImageData = async (imageAttachment) => {
    try {
      //console.log('called getThoughtAttachments');
      const response = await fetch(`${server}/attachments/${brainId}/${imageAttachment.id}/file-content`, {
        method: 'GET',
        headers: {
          //'Accept': 'image/jpeg',
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      if (response.ok) {
        let blob = await response.blob();
        return URL.createObjectURL(blob);
      } else {
        // TODOx
        return 'getImageData response not OK';
      }
    }
    catch {
      // TODOx
      return 'getImageData catch caught a problem';
    }
  };

  const getThoughtAttachments = async (thought) => {
    try {
      //console.log('called getThoughtAttachments');
      const response = await fetch(`${server}/thoughts/${brainId}/${thought.id}/attachments`, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (response.ok) {
        let attachments = await response.json();
        attachments = attachments.filter(x => !x.isNotes && x.type != 12); // 12 for inline images
        //console.log('ATT:\n',attachments,'\n-----\n');
        attachments = attachments.toSorted((a, b) => {
          return a.position - b.position;
        });
        let icon = null;
        if(attachments.length > 0) {
          icon = attachments[0];
        }
        let iconUrl = '';
        if(icon) {
          iconUrl = await getImageData(icon);
        }
        return { thought: thought, iconAttachment: icon, iconUrl };
      } else {
        // TODOx
        console.log('nope :-(');
        //setErrorMessage(attachments.error || 'An error occurred while getting attachments for thought w/ ID {thought.id}.');
      }
    }
    catch {
      // TODOx
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!brainId || !isGuid(brainId)) {
      setErrorMessage('Invalid Brain ID');
      return;
    }

    if (!sourceThoughtId || !isGuid(sourceThoughtId)) {
      setErrorMessage('Invalid Source Thought ID');
      return;
    }

    try {
      //console.log('called HERE');
      const response = await fetch(`${server}/thoughts/${brainId}/${sourceThoughtId}/graph`, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        //setSuccessMessage(`Success! Got some data: ${JSON.stringify(data, null, 2)}`);

        const list = data.children
        .filter(x => !x.name.startsWith('.0'))
        .toSorted((a, b) => {
          return a.cleanedUpName.localeCompare(b.cleanedUpName);
        }); //.map(x => x.cleanedUpName));

        const promises = list.map(getThoughtAttachments);
        
        const atts = await Promise.all(promises);
        setItems(atts);
      } else {
        setErrorMessage(data.error || 'An error occurred while getting the thought graph.');
      }
    } catch (error) {
      setErrorMessage('Error during fetch operation: ' + error.message);
    }

  };

  return (
    <main className="flex flex-col min-h-screen items-center justify-center bg-gray-800 p-4 text-[#cde]">
      
      <Head>
        <title>TheBrain API Quickstart</title>
      </Head>

      <p>{apiKey}</p>

      <div className="mb-8">
        <div className="text-center text-4xl font-bold mb-4">Create New Thought</div>
        <hr className="mb-4 border-gray-500"/>
        <ol>
          <li>Log in to the embedded Web Client below with your TheBrain Account credentials.</li>
          <li>Open a brain and activate a thought.</li>
          <li>Right-click the thought and select <code>Open in New Tab</code>.</li>
          <li>Copy the first Guid in the URL and paste into the <code>Brain ID</code> text entry on this page.</li>
          <li>Copy the second Guid in the URL and paste into the <code>Source Thought ID</code> text entry on this page.</li>
          <li>Fill in the <code>Name</code> and <code>Label</code> field for the thought to create.</li>
          <li>Click <code>Create Thought</code> and watch the magic happen!</li>
        </ol>
      </div>

      <form id="createThoughtCard" onSubmit={handleSubmit} className="flex flex-col bg-gray-600 w-full max-w-[800px] rounded-lg shadow-lg p-8 mb-12">

        <div className="flex flex-row justify-center divide-x divide-gray-500">

          <div className="flex flex-col w-full pr-4">
            <div className="mb-4">
              <h1 className="text-center text-xl font-bold mb-4">Brain ID</h1>
              <input 
                type="text" 
                placeholder="Brain ID to create the new thought in" 
                className="block w-full border rounded p-2" 
                value={brainId}
                //onChange={(e) => setBrainId(e.target.value)} 
              />
            </div>

            <div className="mb-4">
              <h1 className="text-center text-xl font-bold mb-4">Source Thought ID</h1>
              <input 
                type="text" 
                placeholder="Thought ID to link the new thought to" 
                className="block w-full border rounded p-2"
                value={sourceThoughtId}
                //onChange={(e) => setSourceThoughtId(e.target.value)} 
              />
            </div>

          </div>

        </div>

        <div className="flex flex-row justify-center">
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded w-full mt-4 py-2 transition-colors duration-150 ease-out">
            Do the Thing!
          </button>
        </div>
        
        <div className="text-center">
          {successMessage && <div className="text-green-500 mt-4">{successMessage}</div>}
          {errorMessage && <div className="text-red-500 mt-4">{errorMessage}</div>}
        </div>

      </form>

      {/* <div className="">
        <table>
          <tbody>
            {items.map((item, ix) =>
              <tr>
                <td>Item {ix}</td>
                <td><pre>{JSON.stringify(item, null, 2)}</pre></td>
              </tr>
            )}
          </tbody>
        </table>
      </div> */}

      <div className="">
        {items.map((item, ix) =>
          <div style={{width:"14em"}} className="inline-block align-top m-4 mb-8">
            <a target="_blank" href={`https://app.thebrain.com/brain/${brainId}/${item.thought.id}`}>
              <img style={{width:"12em", height:"auto"}} src={item.iconUrl}/>
            </a>
            <p className="text-xl">{item.thought.cleanedUpName}</p>
            <p className="text-sm">{item.thought.label}</p>
          </div>
        )}
      </div>

      {/* <iframe src="https://app.thebrain.com" className="w-full max-w-[800px] h-[600px] bg-[#1f2125] border border-gray-600 rounded-lg shadow-lg"/> */}

    </main>
  )
}
