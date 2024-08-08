if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/MyDictionary/service-worker.js")
    .then(() => {
      console.log("Service Worker Registered");
    });
}

let editId = null;

function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("DictionaryDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore("words", { keyPath: "id", autoIncrement: true });
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject("IndexedDB initialization failed");
    };
  });
}

async function fetchDefinition(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Word not found on DictionaryAPI");
      } else if (response.status === 503) {
        throw new Error("Service temporarily unavailable");
      } else {
        throw new Error("An unexpected error occurred");
      }
    }
    const data = await response.json();
    return data[0].meanings[0].definitions[0].definition;
  } catch (error) {
    throw error;
  }
}

function saveWord(db, word, definition) {
  const transaction = db.transaction(["words"], "readwrite");
  const store = transaction.objectStore("words");

  if (editId) {
    store.put({ id: editId, word, definition });
    editId = null;
  } else {
    store.add({ word, definition });
  }
}

function deleteWord(db, id) {
  const transaction = db.transaction(["words"], "readwrite");
  const store = transaction.objectStore("words");
  store.delete(id);
}

function renderTable(db) {
  const transaction = db.transaction(["words"], "readonly");
  const store = transaction.objectStore("words");
  const request = store.getAll();

  request.onsuccess = () => {
    const words = request.result;
    const tbody = document.querySelector("#resultsTable tbody");
    tbody.innerHTML = "";

    words.forEach(({ id, word, definition }) => {
      const row = document.createElement("tr");

      row.innerHTML = `
                <td>${id}</td>
                <td>${word}</td>
                <td>${definition}</td>
                <td><button class="editBtn">✏️</button></td>
                <td><button class="deleteBtn">🗑️</button></td>
            `;

      row.querySelector(".editBtn").addEventListener("click", () => {
        document.getElementById("searchInput").value = word;
        editId = id;
      });

      row.querySelector(".deleteBtn").addEventListener("click", () => {
        deleteWord(db, id);
        renderTable(db);
      });

      tbody.appendChild(row);
    });
  };
}

function showNotification(message, type = "error") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", async () => {
  const db = await initIndexedDB();

  document
    .getElementById("searchForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const word = document.getElementById("searchInput").value.trim();

      if (word) {
        try {
          const definition = await fetchDefinition(word);
          saveWord(db, word, definition);
          renderTable(db);
          document.getElementById("searchInput").value = "";
        } catch (error) {
          showNotification(error.message, "error");
        }
      }
    });

  renderTable(db);
});

/*TODO*/
// Handle exceptions
