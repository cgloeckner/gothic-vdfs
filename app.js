/// Callback on file selection
function on_change() {
	let file = $('#vdfs')[0].files[0]
	if (!file) {
		return
	}
	
	let target = $('#entries')
	
	// clear table
	while (target[0].firstChild) {
		target[0].removeChild(target[0].firstChild)
	}
	
	let archive = new Vdfs(file, () => {
		// append files
		for (const name in archive.entries) {
			const file_size = archive.entries[name].size
			
			let row = target[0].insertRow()
			
			let name_row = row.insertCell()
			name_row.innerHTML = name
			
			let size_row = row.insertCell()
			size_row.innerHTML = file_size
			
			let access_row = row.insertCell()
			let link = archive.download(name)
			link.innerHTML = 'download'
			link.target = '_blank'
			access_row.appendChild(link)
			
			if (name.endsWith('.WAV')) {
				play = document.createElement('button')
				play.innerHTML = 'Play'
				play.onclick = () => {
					audio = archive.playback(name)
					audio.play()
				}
				access_row.appendChild(play)
			}
		}
	})
}
