        // Inisialisasi Supabase Client
        // Gunakan URL dan kunci anonim yang Anda berikan.
        const SUPABASE_URL = 'https://iomdzwcclpgswzuesayj.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbWR6d2NjbHBnc3d6dWVzYXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3Nzg4NDYsImV4cCI6MjA2NjM1NDg0Nn0.xdGO_h7WGOmCdmEIawFEMqxEDn4qF4XDXspMNWXs5iA';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // --- Variabel Global untuk State Aplikasi ---
        let currentUser = null; // Menyimpan objek pengguna saat ini (saat ini anonymous)
        let allPosts = []; // Menyimpan semua postingan yang diambil dari Supabase
        let currentFilteredPosts = []; // Menyimpan postingan yang sedang ditampilkan (setelah filter/pencarian)
        let currentPage = 'feed'; // Menyimpan halaman aktif ('feed' atau 'upload')

        // --- Elemen DOM yang Sering Digunakan ---
        const feedPage = document.getElementById('feed-page');
        const uploadPage = document.getElementById('upload-page');
        const navFeedButton = document.getElementById('nav-feed');
        const navUploadButton = document.getElementById('nav-upload');
        const searchInput = document.getElementById('search-input');
        const postsContainer = document.getElementById('posts-container');
        const feedStatus = document.getElementById('feed-status');
        const fileUploadInput = document.getElementById('file-upload');
        const fileNameDisplay = document.getElementById('file-name-display');
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');
        const tagsInput = document.getElementById('tags');
        const uploadForm = document.getElementById('upload-form');
        const uploadButton = document.getElementById('upload-button');
        const notificationModal = document.getElementById('notification-modal');
        const notificationMessage = document.getElementById('notification-message');
        const modalOkButton = document.getElementById('modal-ok-button');

        // --- Fungsi Utilitas ---

        /**
         * Menampilkan pesan notifikasi di modal kustom.
         * @param {string} msg - Pesan yang akan ditampilkan.
         */
        function showNotification(msg) {
            notificationMessage.textContent = msg;
            notificationModal.classList.remove('hidden');
            setTimeout(() => {
                notificationModal.classList.add('hidden');
            }, 3000); // Modal akan otomatis hilang setelah 3 detik
        }

        /**
         * Mengganti halaman yang terlihat (antara 'feed' dan 'upload').
         * @param {string} pageName - Nama halaman yang akan ditampilkan ('feed' atau 'upload').
         */
        function showPage(pageName) {
            currentPage = pageName;
            if (pageName === 'feed') {
                feedPage.classList.remove('hidden');
                uploadPage.classList.add('hidden');
                navFeedButton.classList.add('bg-red-500', 'text-white', 'shadow-md');
                navFeedButton.classList.remove('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-700');
                navUploadButton.classList.remove('bg-red-500', 'text-white', 'shadow-md');
                navUploadButton.classList.add('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-700');
                fetchPosts(); // Muat ulang postingan saat kembali ke feed
            } else if (pageName === 'upload') {
                feedPage.classList.add('hidden');
                uploadPage.classList.remove('hidden');
                navUploadButton.classList.add('bg-red-500', 'text-white', 'shadow-md');
                navUploadButton.classList.remove('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-700');
                navFeedButton.classList.remove('bg-red-500', 'text-white', 'shadow-md');
                navFeedButton.classList.add('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-700');
            }
        }
/**
         * Membuat elemen kartu postingan untuk ditampilkan di beranda.
         * @param {object} post - Objek data postingan.
         * @returns {HTMLElement} - Elemen div kartu postingan.
         */
        function createPostCard(post) {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out';

            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'w-full h-48 sm:h-56 md:h-64 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center';

            if (post.media_type === 'image') {
                const img = document.createElement('img');
                img.src = post.media_url;
                img.alt = post.title || 'No Title';
                img.className = 'w-full h-full object-cover transition-opacity duration-300 hover:opacity-80';
                img.onerror = () => {
                    img.src = `https://placehold.co/400x300/cccccc/333333?text=Gambar+Tidak+Tersedia`;
                };
                mediaContainer.appendChild(img);
            } else if (post.media_type === 'video') {
                const video = document.createElement('video');
                video.src = post.media_url;
                video.controls = true;
                video.className = 'w-full h-full object-cover';
                video.onerror = () => {
                    video.parentNode.innerHTML = '<div class="text-gray-600 dark:text-gray-400">Video tidak dapat diputar.</div>';
                };
                mediaContainer.appendChild(video);
            } else {
                const unsupportedText = document.createElement('div');
                unsupportedText.className = 'text-gray-600 dark:text-gray-400';
                unsupportedText.textContent = 'Format media tidak didukung.';
                mediaContainer.appendChild(unsupportedText);
            }
            card.appendChild(mediaContainer);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'p-4';

            const titleH3 = document.createElement('h3');
            titleH3.className = 'text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2 truncate';
            titleH3.textContent = post.title || 'Tanpa Judul';
            contentDiv.appendChild(titleH3);

            const descriptionP = document.createElement('p');
            descriptionP.className = 'text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2';
            descriptionP.textContent = post.description || 'Tidak ada deskripsi.';
            contentDiv.appendChild(descriptionP);

            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'flex flex-wrap gap-2 text-xs';
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach(tag => {
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 px-2 py-1 rounded-full font-medium';
                    tagSpan.textContent = `#${tag}`;
                    tagsDiv.appendChild(tagSpan);
                });
            }
            contentDiv.appendChild(tagsDiv);

            card.appendChild(contentDiv);
            return card;
        }
/**
         * Merender daftar postingan ke dalam container di halaman feed.
         * @param {Array} postsToRender - Array objek postingan yang akan ditampilkan.
         */
        function renderFeed(postsToRender) {
            postsContainer.innerHTML = ''; // Kosongkan container
            if (postsToRender.length === 0) {
                feedStatus.textContent = 'Tidak ada postingan yang ditemukan.';
            } else {
                feedStatus.textContent = ''; // Sembunyikan status
                postsToRender.forEach(post => {
                    postsContainer.appendChild(createPostCard(post));
                });
            }
        }

        // --- Fungsi Supabase & Data Handling ---

        /**
         * Menginisialisasi autentikasi pengguna (saat ini anonim).
         */
        async function initAuth() {
            feedStatus.textContent = 'Memuat PinQi...';
            try {
                // Coba login anonim jika belum ada sesi
                const { data: { user }, error } = await supabase.auth.signInAnonymously();
                if (error) throw error;
                currentUser = user;
                console.log('Signed in anonymously:', currentUser);
            } catch (error) {
                console.error('Error during anonymous sign-in:', error.message);
                showNotification('Gagal autentikasi: ' + error.message);
            } finally {
                // Setelah autentikasi selesai, ambil dan tampilkan postingan
                fetchPosts();
            }

            // Mendengarkan perubahan status autentikasi
            supabase.auth.onAuthStateChange((_event, session) => {
                currentUser = session?.user || null;
                console.log('Auth state changed:', currentUser);
            });
        }

        /**
         * Mengambil semua postingan dari Supabase dan menampilkannya.
         */
        async function fetchPosts() {
            feedStatus.textContent = 'Memuat konten...';
            postsContainer.innerHTML = ''; // Kosongkan container saat memuat
            try {
                const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    .order('created_at', { ascending: false }); // Urutkan berdasarkan waktu terbaru

                if (error) throw error;
                allPosts = data;
                currentFilteredPosts = data; // Inisialisasi dengan semua postingan
                renderFeed(currentFilteredPosts); // Render semua postingan
            } catch (error) {
                showNotification(`Gagal memuat postingan: ${error.message}`);
                console.error('Error fetching posts:', error.message);
                feedStatus.textContent = 'Gagal memuat postingan.';
            }
        }
/**
         * Menangani proses unggah file dan metadata ke Supabase.
         * @param {Event} e - Objek event form submission.
         */
        async function handleUpload(e) {
            e.preventDefault(); // Mencegah refresh halaman
            
            const file = fileUploadInput.files[0];
            const title = titleInput.value.trim();
            const description = descriptionInput.value.trim();
            const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

            if (!file) {
                showNotification('Silakan pilih foto atau video untuk diunggah.');
                return;
            }
            if (!title) {
                showNotification('Judul tidak boleh kosong.');
                return;
            }

            uploadButton.disabled = true; // Nonaktifkan tombol saat mengunggah
            uploadButton.textContent = 'Mengunggah...';
            uploadButton.classList.add('bg-red-300', 'cursor-not-allowed');
            uploadButton.classList.remove('bg-red-500', 'hover:bg-red-600', 'transform', 'hover:scale-105');

            let mediaUrl = '';
            const fileExtension = file.name.split('.').pop();
            // Gunakan userId untuk nama file agar unik, atau fallback ke random UUID
            const fileRandomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const fileName = `${currentUser ? currentUser.id : 'anonymous'}-${Date.now()}-${fileRandomId}.${fileExtension}`;
            const mediaType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'other';

            try {
                // Unggah file ke Supabase Storage
                const { data, error: uploadError } = await supabase.storage
                    .from('pinqi-media') // Nama bucket Supabase Anda
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false, // Jangan timpa jika file sudah ada
                    });

                if (uploadError) throw uploadError;

                // Dapatkan URL publik dari file yang diunggah
                const { data: publicUrlData } = supabase.storage
                    .from('pinqi-media') // Pastikan nama bucket sama
                    .getPublicUrl(fileName);

                mediaUrl = publicUrlData.publicUrl;

                // Masukkan metadata postingan ke database Supabase
                const { error: dbError } = await supabase.from('posts').insert({
                    title: title,
                    description: description,
                    tags: tags,
                    media_url: mediaUrl,
                    media_type: mediaType,
                    user_id: currentUser ? currentUser.id : null,
                });

                if (dbError) throw dbError;

                showNotification('Postingan berhasil diunggah!');
                // Reset form setelah unggah berhasil
                fileUploadInput.value = '';
                fileNameDisplay.textContent = '';
                fileNameDisplay.classList.add('hidden');
                titleInput.value = '';
                descriptionInput.value = '';
                tagsInput.value = '';
                showPage('feed'); // Kembali ke halaman beranda
            } catch (error) {
                showNotification(`Gagal mengunggah: ${error.message}`);
                console.error('Error uploading:', error.message);
            } finally {
                uploadButton.disabled = false; // Aktifkan kembali tombol
                uploadButton.textContent = 'Unggah Postingan';
                uploadButton.classList.remove('bg-red-300', 'cursor-not-allowed');
                uploadButton.classList.add('bg-red-500', 'hover:bg-red-600', 'transform', 'hover:scale-105');
            }
         }
// --- Event Listeners ---
        window.addEventListener('load', () => {
            initAuth(); // Inisialisasi autentikasi dan muat data awal
            showPage('feed'); // Tampilkan halaman feed secara default

            // Realtime listener for new posts
            // This allows the feed to update automatically when new posts are added
            const channel = supabase
                .channel('posts-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
                    console.log('Change received!', payload);
                    if (currentPage === 'feed') { // Hanya perbarui jika sedang di halaman feed
                        fetchPosts(); // Re-fetch all posts to update the feed
                    }
                })
                .subscribe();

            // Cleanup for the channel (optional, typically for single-page app lifecycle)
            // window.addEventListener('beforeunload', () => supabase.removeChannel(channel));
        });

        navFeedButton.addEventListener('click', () => showPage('feed'));
        navUploadButton.addEventListener('click', () => showPage('upload'));

        searchInput.addEventListener('input', handleSearch);

        fileUploadInput.addEventListener('change', () => {
            if (fileUploadInput.files && fileUploadInput.files[0]) {
                fileNameDisplay.textContent = `File yang dipilih: ${fileUploadInput.files[0].name}`;
                fileNameDisplay.classList.remove('hidden');
            } else {
                fileNameDisplay.textContent = '';
                fileNameDisplay.classList.add('hidden');
            }
        });

        uploadForm.addEventListener('submit', handleUpload);
        modalOkButton.addEventListener('click', () => notificationModal.classList.add('hidden'));

// Countdown timer: misalnya 1 jam dari sekarang
const countdownElement = document.getElementById('timer');
const now = new Date().getTime();
const endTime = now + 60 * 60 * 1000; // 1 jam dari sekarang

function updateCountdown() {
  const now = new Date().getTime();
  const distance = endTime - now;

  if (distance <= 0) {
    countdownElement.textContent = "00:00:00";
    return;
  }

  const hours = Math.floor(distance / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  countdownElement.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(n) {
  return n < 10 ? '0' + n : n;
}

setInterval(updateCountdown, 1000);
updateCountdown();
    </script>
</body>
</html>

        }
