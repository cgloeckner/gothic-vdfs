/// Based on https://stackoverflow.com/a/55152476

async function readFilesArrayBuffer(file) {
    let result_base64 = await new Promise((resolve) => {
        let fileReader = new FileReader();
        fileReader.onload = (e) => resolve(fileReader. result);
        fileReader.readAsArrayBuffer(file);
    });

    return result_base64;
}


/// Based on https://github.com/icculus/physfs/blob/main/src/physfs_archiver_vdf.c


class Vdfs {

	static COMMENT_LENGTH = 256
	static SIGNATURE_LENGTH = 16
	static SIGNATURE_G1 = "PSVDSC_V2.00\r\n\r\n"
	static ENTRY_NAME_LENGTH = 64
	static ENTRY_IS_DIR = 0x80000000
	
	constructor(file, when_done) {
		this.file = file
		this.entries = []
		
		readFilesArrayBuffer(file).then(buffer => {
			this.load_from_buffer(buffer)
			when_done()
		})
	}
	
	/// Load from array buffer
	load_from_buffer(array_buffer) {
		this.view = new DataView(array_buffer)
		
		let offset = this.root_cat_offset
		let num_files = this.count
		console.debug(`${this.file.name} contains ${num_files} files`)
		
		while (num_files > 0) {
			// parse data from binary
			const name = this.get_string(offset, Vdfs.ENTRY_NAME_LENGTH).trim()
			offset += Vdfs.ENTRY_NAME_LENGTH
			const jump = this.get_uint32(offset)
			offset += 4
			const size = this.get_uint32(offset)
			offset += 4
			const type = this.get_uint32(offset)
			offset += 8 // skipping `attr` data
			
			if (type & Vdfs.ENTRY_IS_DIR) {
				//console.debug(`skipping directory ${name}`)
				continue
			}
			
			// create entry
			this.entries[name] = {
				name: name,
				jump: jump,
				size: size
			}
			num_files--
		}
	}
	
	/// Generate download link
	download(name) {
		const buffer = this.get_entry(name).buffer		
		const blob = new Blob([buffer])
		
		const url = URL.createObjectURL(blob)
		
		const link = document.createElement('a')
		link.href = url
		link.download = name
		
		return link
	}
	
	/// Generate audio for playback
	playback(name) {
		const buffer = this.get_entry(name).buffer
		
		const blob = new Blob([buffer])
		const url = URL.createObjectURL(blob)
		
		let audio = new Audio()
		
		let reader = new FileReader()
		reader.onload = (e) => {
			audio.src = reader.result
			// FIXME: original Gothic1 used IMA ADPCM which is not supported by browsers (mod audio may work)
		}
		
		reader.readAsDataURL(blob)
		
		return audio
	}

	/// Load entry as DataView to an Uin8Array
	get_entry(name) {
		const entry = this.entries[name]
		const end = entry.jump + entry.size
		return new DataView(this.view.buffer.slice(entry.jump, end))
	}
	
	/// Load string of `len` from position `at`
	get_string(at, len) {
		let s = ''
		for (let i = 0; i < len; i++) {
			const c = this.view.getUint8(at + i)
			s += String.fromCharCode(c)
		}
		return s
	}
	
	/// Load little endian uint32 from position `at`
	get_uint32(at) {
		return this.view.getUint32(at, true)
	}
	
	/// Load archive's signature
	get signature() {
		return this.get_string(Vdfs.COMMENT_LENGTH, Vdfs.SIGNATURE_LENGTH)
	}
	
	/// Load archive's file count
	get count() {
		return this.get_uint32(Vdfs.COMMENT_LENGTH + Vdfs.SIGNATURE_LENGTH + 4)
	}
	
	/// Load archive's timestamp (FIXME: odd.., see github url above)
	get timestamp() {
		return this.get_uint32(Vdfs.COMMENT_LENGTH + Vdfs.SIGNATURE_LENGTH + 8)
	}
	
	/// Load archive's file size
	get data_size() {
		return this.get_uint32(Vdfs.COMMENT_LENGTH + Vdfs.SIGNATURE_LENGTH + 12)
	}
	
	/// Load archive's start-of-data-offset
	get root_cat_offset() {
		return this.get_uint32(Vdfs.COMMENT_LENGTH + Vdfs.SIGNATURE_LENGTH + 16)
	}
	
	/// Load archive's version
	get version() {
		return this.get_uint32(Vdfs.COMMENT_LENGTH + Vdfs.SIGNATURE_LENGTH + 20)
	}
}
