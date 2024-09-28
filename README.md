# RECREATING BITTORENT FROM SCRATCH USING NODE.JS (Unfinished)

I don't know how I never published this, but this is basically a weekend in 2023 where I attempted recreating the bittorrent peer-to-peer protocol for fun.
I also seem to have written about the process so I'll leave it under here, enjoy

p.s: this doesn't work 100%, I remember some flaws with bencode that I fixed, but for some reason it wouldn't download from a torrent link no matter how much I tried fixing it.

## BITTORENT.txt

BITTORENT:
----------

	- protocol for downloading files across the internet in peer-to-peer fashion.
	- our client should be able to find peers and exchange data with them.
	- protocol has evolved over the years with features like;
		+ encryption
		+ private torrents
		+ new ways to find peers
		
	- We're implementing the original 2001 spec.
		https://www.bittorrent.org/beps/bep_0003.html

	- trackers are like a bar where u meet new people.
	- they are central servers that introduce peers to eachother.

	- new methods have cut out the middle man by making the peer discovery a distributed process.
	
	- A .torrent file informs u of the contents of a torrentable file and information for connecting to a tracker. 
	- a mess of a link that's encoded in a format called bencode 'Bee-encode'
	- 7: i7e
	- "spam": 4:spam
	- ["spam", '7'] = l4:spami7ee

	- forget this. teps to making one in node.js


NODEJS:
	
	- npm install bencode and bignum -> (bignum deprecated)
	
	- desc: send requests to something called tracker, so it sends back a list of peers (think of 		it like a party to meet people). then connect to them directly and start downloading 		by exchanging messages on the pieces they have and the pieces they want.

	- for more info: 
			+ https://www.morehawes.ca/old-guides/the-bittorrent-protocol
			+ https://www.bittorrent.org/beps/bep_0015.html


	- lets find or create a torrent file: https://webtorrent.io/free-torrents
	- readFileSync it into a variable (import fs)
	- it returns a buffer instead of a string.

	- In node.js a buffer is a container for raw bytes. A byte just means eight bits, and a bit is 	  just a 0 or a 1. So a byte might look like 10101010 or

	- if you wanna read it, provide an encoding scheme = (utf8)
	- Bencode is data serialization format, like json or xml but only used for torrenting
	
	- install the bencode if you havent already npm install --save bencode.
	- or write one yourself. good luck 

	- then the torrent should become something like
		torrent = bencode.decode(fs.readFileSync('puppy.torrent')); ... add utf8 in the second 		argument in the latest version of bencode

	- torrent.announce.toString('utf8')
	- we use the udp protocole instead of the http one.

	- HTTP vs UDP

		+ udp is more performant than http.
		+ main different is that http is built on tcp which ensures that when user1 sends 		  data, user2 will receive it in its entirety and uncorrupted, in the correct order. 		  which makes it slower because it keeps a persistent connection.
		+ udp is good for small messages (less than 512 bytes). and tcp / http is good for the 		  massive files between peers.

	- improt dgram, buffer and url.
	- use urlparse with the torrent-announce-tostring-utf8
		that allows us to extract the protocol, hostname, port...
	- dgram is for udp. 

	- sockets are objects which through network communications happen. 

	- we pass it an argument of udp4 because that's what we need to use the 4byte IPv4 address 	  format (124.0.0.1)
	- we can also use udp6 but it's rarely used.
	- in order to send a message, it has to be a buffer. Buffer.from(s, "utf8") is an easy way.
	- socket.send sends the message. 

	- those are the faulty basics
	- now: 

	- the tracker expects 4 things: 
		- us sending a connect request
		- us getting the connect response and extracting the connection id
		- using the connection id to send an announce request.
		- getting the announce response and extracting the peers list.
	
	- lets create a new file to handle the trackers 
	- importing the dgram, buffer and url
	
 	- export getPeers which takes torrent and a callback.
	- create a const socket with dgram's create socket with udp4 specification
	- create a url that takes the torrent's announce property and convert it to string utf8
	- udpSend(socket, buildConnReq(), url)
		udp send is a function that takes a socket, a message, a rawUrl, and a callback
		it creates a const url with urlParseing the rawUrl
		and socket sends the message with the send method	
		- its parameters: (message, 0, message.length, url.port, url.host, callback)
	- for now lets create dummy functions to receive the messages
	- socket on message, the response is a callback function that checks if the respType(response)
	  is connect: then we create a const connResp = parseConnResp(response) and an announcement 	  that builds the announcement requirement with the connection response's connectionid 	  	  property.
	- but if the response type is announce. parse it using a function and callback the 		  announceResp.peers;

	- as for our index:
		the torrent is being bencode decoded.
		and tracker is a constant that getPeers from the other file with the torrent and a 		callback of the peers.

	- this is where it gets stupid 
		each message is a buffer in a specific format called BEP
		https://www.bittorrent.org/beps/bep_0015.html
	- message starts with a 64 bit integer (8 bytes) at index0 and the value should be 
		0x41727101980 // magic constant
	- now at index 8, a 32 bit integer with the value 0, means (8 bytes)
	- now at index 12, a 32 bit integer with a random transaction id
	- total message length 8 + 4 + 4 = 16 bytes.
	- <Buffer 00 00 04 17 27 10 19 80 00 00 00 00 ?? ?? ?? ??>
		

	- in the tracker.js import crypto.
	- function buildConnReq: 
		- create a const buf that buffer.alloc(16 bytes)
		- buf.writeUInt32BE(0x417,0)
		- buf.writeUInt32BE(0x27101980, 4)
		- buf.writeUInt32BE(0, 8); // 4
  		
  		- crypto.randomBytes(4).copy(buf, 12); // 5
	then return the buf

	- 0x means the number is in hexaformat
	- why we split it is cause there's no way to write a 64 bit integer in node.js (unsupported)
	
	- parsing the response is much simpler.
		- function parseConnResp(resp) {
  			return {
    			action: resp.readUInt32BE(0),
    			transactionId: resp.readUInt32BE(4),
    			connectionId: resp.slice(8)
  				}
			}


	- announce messaging though similar to the request and response. there are still some things to look out for.
	
	- create a const from a torrent-parser.js (we make it later)
	- create a util.js and const it 

	- announceReq changes to add the torrent too instead of just the connection request.

	- function buildAnnounceReq(connId, torrent, port=6881) {
		  const buf = Buffer.allocUnsafe(98);

  		// connection id
  		connId.copy(buf, 0);
  		// action
  		buf.writeUInt32BE(1, 8);
  		// transaction id
  		crypto.randomBytes(4).copy(buf, 12);
  		// info hash
  		torrentParser.infoHash(torrent).copy(buf, 16);
  		// peerId
  		util.genId().copy(buf, 36);
  		// downloaded
  		Buffer.alloc(8).copy(buf, 56);
  		// left
  		torrentParser.size(torrent).copy(buf, 64);
  		// uploaded
  		Buffer.alloc(8).copy(buf, 72);
  		// event
  		buf.writeUInt32BE(0, 80);
  		// ip address
  		buf.writeUInt32BE(0, 80);
  		// key
  		crypto.randomBytes(4).copy(buf, 88);
  		// num want
  		buf.writeInt32BE(-1, 92);
  		// port
  		buf.writeUInt16BE(port, 96);
		
		  return buf;
		}



	- some stuff happens with that function now for the rest.

		DAY 2:
		------


	- Parsing response:
		+ its a bit tricky
			20 + 6 * n  32-bit integer  IP address
			24 + 6 * n  16-bit integer  TCP port
			20 + 6 * N   also a port 
	
	- our parsing function takes the response as an argument: 
		inside the function, new function called group that takes the iterable and the 			groupSize. creates a variable array and loops through the iterable.length, and adds by 		the groupsize ( i += groupsize ) and pushes the iterable that's sliced from i to 		i + groupsize;
		return groups

	- our return is an action that's gonna read uint32BE(0), transactionId same thing but 4, 
	  leechers 8, seeders 12, but for the peers: group the response that's sliced from 20 and 	  iterate with 6, then maps the address to return and object with id property and port:
		
		return {
        		ip: address.slice(0, 4).join('.'),
        		port: address.readUInt16BE(4)
      		}

	- its gonna be a big object basically

	- in the torrent parser, we're going to extract information out of the torrent file.
		export a function called open that takes a filepath as a parameter and spits out the 		bencode decode of the readfilesync output
	- also create dummy size and infohash functions

	- in the index the const torrent becomes a torrentParser constant.opening the torrent we have.

	- now for the hashing. just pass the info though a sha1 hashing function
		in the torrent parser, the infohash function takes a torrent and creates a constant 		the bencode encode of the torrent.info then its returns 
		crypto.createHash('sha1').update(info).digest();


	- reason we use sha1 is because its the one used by bittorent.
	- it'll return a 20 byte long buffer.
	- we also use it cause its unique and very good to identify a torrent.

	- try to fix npm bignum
	- in the torrentparser, take the torrent as a parameter and create a size constant that equals 	  the torrent.info.files
	- its either the size of every file or the size of one file (depending on how many the torrent 	  has)

	- torrent.info.files.map(file => file.length).reduce((a, b) => a + b) : torrent.info.length;
	- return bignum.toBuffer(size, {size: 8});

	- the size 8 is a requirement by the announcement request.
	
	- now for the response type and the retries
	- detect between the connect respinse and the announce response (action detection)
	- const action = response.readUint32BE(0) and if = 0 return 'connect' if = 1 return 'announce'

	- if you do make it, you should wait about 2^n * 15 seconds between each request 



"And that’s all we need to be able to run the program and get a list of peers for our torrent.

It’s possible that when you run the program it will hang. As I mentioned before it’s possible for udp messages to get dropped in transit, so if that happens just try rerunning the program. Or you could write your own function to retry after a timeout"



	- DOWNLAOD FROM PEERS
		+ Create a TCP connection
		+ More peers you can get connected, the faster you can download your files
		+ A torrent’s shared files are broken up into pieces so that you can download 			  different parts of the files from different peers simultaneously.
		+ Ideally you want all the connections to be requesting different and new pieces so 		  you’ll need to keep track of which pieces you already have and which ones you still 		  need.
		+ when you receive the pieces they’ll be stored in memory so you’ll need to write the 		  data to your hard disk.
		


	- Family Fighting outside, I'm unable to focus on this right now. Maybe later.
	
		DAY 3:
		------

	- We need to handle the download now.
	- create a seperate js file for downloading.
	- for now we'll work on downloading from the terminal aka process.argv[2]
	- donwload(torrent) : method from the download.js

	-node index.js /file/path/to/name-of-torrent.torrent

	- this time we'll use the tcp protocol. so, we use the net module.
	- create a new socket constant with new net.socket();
	- socket.on('error')-> handle it 
	- socket connect to the port, ip, function() that'll socket.write with a buffer.from string.
	- socket listening with on for 'data', the response is a buffer that we'll do something with 

	- We use our getPeers method from the tracker.js file, and then for each peer we create a tcp connection and start exchanging messages. Before we can go on we need to know what messages we’ll be sending and receiving.

	- function download(peer) {
	  const socket = net.Socket();
	  socket.on('error', console.log);
	  socket.connect(peer.port, peer.ip, () => {
	    // socket.write(...) write a message here
	  });
	  socket.on('data', data => {
	    // handle response here
	  });
	}

	-  Once connection is established: here are the steps to the protocol:
		+ let your peer know which file you're interested in downloading
			if they have it, they send a confirmation
			if they dont, they close connection
			this is known as the handshake
		+ Each have message contains a piece index as its payload, 1 for each piece that your 		  peer has
		+ bitfield gives you a string of indexes that tells you which pieces they have and 		  which they dont.
		+ then there is the choke, unchoke, interested, uninterested
			+ choke: he doesnt want to share
			+ unchoke: he does want to share
			+ interested: I want the files
			+ uninterested: I dont want the files
		+ at this point u can send requests with the indexes of the pieces u want
		+ finally u receive a piece message, which will contain the bytes of data requested

	- Let's begin:

	- handshake is a buffer that looks like this:
		handshake: <pstrlen><pstr><reserved><info_hash><peer_id>

		pstrlen: string length of <pstr>, as a single raw byte
		pstr: string identifier of the protocol
		reserved: eight (8) reserved bytes. All current implementations use all zeroes.
		peer_id: 20-byte string used as a unique ID for the client.

		In version 1.0 of the BitTorrent protocol, pstrlen = 19, and pstr = "BitTorrent 		protocol".
	
	- once the handshake is established:
		10 DIFFERENT TYPES OF MESSAGES all following the same format;
			+ 4 bytes indicating the length of the message
			+ 1 byte for the id
			+ the rest is the message payload that varies per message
			
			More info: https://wiki.theory.org/BitTorrentSpecification#Messages
	
	- I still dont understand exactly why they use 68 bits for bytes for the allocation
		create a 68 buffer
		write uint32BE 19,0          19
		write BitTorent protocol,1   BitTorrent protocol	19 is the size
		write UInt32Be0,20           00 00 00 00 
		write Unit32BE0,24	     00 00 00 00
		torrentParser.infoHash the torrent and copy into the buf from the 28th index
		buf write the genId().
		return the buffer
	- to keep alive, just allocate 4 bytes so when there's no request, connection persists
	- build a choke, unchoke, interested and uninterested point with a fixed length and a 
	  bufferwrite of 8 bytes with the id of the point
		+ 0 for choke
		+ 1 for unchoke
		+ 2 for interested
		+ 3 for uninterested
	- for have, allocate 9, fixed length of 5, write the 8-bit id, then the actual payload index 
			55 55 55 55 44 pa yl oa d?
	- for Bitfield, allocate 14, write the payload length, + 1 in 0, id 8 byte 5, property 		  bitfield copy to buffer from index 5
	- Rest goes to same: here's a commonjs version of it

		module.exports.buildRequest = payload => {
  const buf = Buffer.alloc(17);
  // length
  buf.writeUInt32BE(13, 0);
  // id
  buf.writeUInt8(6, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // length
  buf.writeUInt32BE(payload.length, 13);
  return buf;
};

module.exports.buildPiece = payload => {
  const buf = Buffer.alloc(payload.block.length + 13);
  // length
  buf.writeUInt32BE(payload.block.length + 9, 0);
  // id
  buf.writeUInt8(7, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // block
  payload.block.copy(buf, 13);
  return buf;
};

module.exports.buildCancel = payload => {
  const buf = Buffer.alloc(17);
  // length
  buf.writeUInt32BE(13, 0);
  // id
  buf.writeUInt8(8, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // length
  buf.writeUInt32BE(payload.length, 13);
  return buf;
};

module.exports.buildPort = payload => {
  const buf = Buffer.alloc(7);
  // length
  buf.writeUInt32BE(3, 0);
  // id
  buf.writeUInt8(9, 4);
  // listen-port
  buf.writeUInt16BE(payload, 5);
  return buf;
};


	- now why do we send the length? when the messages come in, even if part of it 			is in, we'll know that we need more, before the next message.
		
	- after the connect function, write a onWholeMessage function that takes the socket, 		and uses the data to handle the response.

	- the next function determines whether u're getting a part or the whole message, if 		its the whole message, handshake is true and the function is done building it. else, 		the handshake is false, and while the savedbuf length is bigger than 4 and lesser than 		the message length, we're gonna keep slicing until everything is true.
		
	- after that, write the ishandshake message that checkes if its a handshake through 		string comparison, also a message handler function that checks if its a hanshake, 		build the interested message, and finally the download function.


	- Pieces:

	- now we'll start handeling messages that aren't handshakes. study their function well
		
