
(function() {
	var origWindowOnload = window.onload || function() {};
	window.onload = function() {
		main_start();
	}
}) ();

function copyClipboard()
{
	navigator.clipboard.writeText(out);
}

function download()
{
	var blob = new Blob([out], {type: "text/plain;charset=utf-8"});
	saveAs(blob, window.filename + ".json");
}

function runEvaluation()
{
	var evalText = document.getElementById('evalText').value;
	var success;
	try {
		window.out = JSON.stringify(eval(evalText), null, 3);
		document.getElementById('output').innerText = out;
		document.getElementById('useOutput').hidden = false;
	} catch (e)
	{
		window.out = '';
		document.getElementById('output').innerText = e.stack.toString();
		document.getElementById('useOutput').hidden = true;
	}

}


function showEvalBox()
{
	document.getElementById('showAfterZipDownloaded').hidden = false;
}

function onAllGuidesConcluded()
{
	window.events = lines.map((line, i)=>
		{
			console.log(line);
			console.log(i);
			return JSON.parse(line.startsWith('guide:') ? guides[i] : line.split(':').slice(1).join(':'));
		}
	);
	document.getElementById('missingGuidesAlert').hidden = (numGuidesLoadFailed == 0);
	showEvalBox();
}
function fixJson(text)
{
	// For some reason the JSON does not end with } but with strange characters.
	// TODO : investigate why


	// Fix - remove characters from the end of the string until it's the sign '}'
	while (text && text.slice(-1) != '}') // Remove
	{
		text = text.slice(0, -1);
	}
	return text;
}

function zipLoaded(zip)
{
	p1 = zip.file('RW/commEvents.txt').async('text');
	numGuidesLoaded = 0;
	numGuidesLoadFailed = 0;
	p1.then(function(txt) 
		{
			window.lines = txt.split('\n').filter(line=> !!line);
			lines = lines.splice(1); // Ignore first line as it's meta.
			
			window.guides = lines.map(line=>line.startsWith('guide:') ? line.split(':')[1] : null);
			guides = guides.map(name=>name ? name.slice(1) : null); // Remove the opening slash ('/') from the lines
			var numGuides = guides.filter(line=> line != null).length;
			var onGuideConcluded = function()
			{
				if (numGuidesLoaded + numGuidesLoadFailed == numGuides)
				{
					onAllGuidesConcluded();
				}
			}
			var onGuideLoaded = function(index, text)
			{
				guides[index] = fixJson(text);
				numGuidesLoaded++;
				onGuideConcluded();
			};
			var onGuideLoadFailed = function(index)
			{
				guides[index] = '{}';
				numGuidesLoadFailed++;
				onGuideConcluded();
			}
			guides.forEach((guide, i)=>
			{
				if (guide)
				{
					console.log(guide);
					var f = zip.file(guide);
					if (f)
					{
						zip.file(guide).async('text').then(onGuideLoaded.bind(this, i), onGuideLoadFailed.bind(this, i))
					}
					else
					{
						onGuideLoadFailed(i)
					}
				}
			});
			if (numGuides == 0)
			{
				onAllGuidesConcluded();
			}
		}
	);
}

function handleFile( evt )
{
	window.filename = this.files[0].name;
	if (filename.toLowerCase().endsWith('.zip'))
	{
		filename = filename.slice(0,-4);
	}
	var zip = new JSZip();
	zip.loadAsync( this.files[0]) .then(zipLoaded, function() {alert("Not a valid zip file")}); 
};


function main_start()
{
        var fileSelected = document.getElementById( "zipUpload" );
	if ( window.File && window.FileReader && window.FileList && window.Blob )
    {
        var fileSelected = document.getElementById( "zipUpload" );
        fileSelected.addEventListener( "change", handleFile, false );
    } 
    else
    { 
        alert( "Files are not supported" ); 
    } 
}
