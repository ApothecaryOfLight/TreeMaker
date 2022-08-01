console.log("hello");

const myTree = [];

function addRootNode() {
	const newNode = document.createElement("div");
	newNode.classList = "box";
	
	const add_button_reference = addNodeElements( newNode, "Root" );
	
	const tree_container = document.getElementById("lens");
	tree_container.appendChild( newNode );
	
	const myDraggable = new PlainDraggable( newNode );
	
	const tree_container_props = window.getComputedStyle(tree_container);
	const tree_container_width_txt = tree_container_props.width;
	const tree_container_width = tree_container_width_txt.substring( 0, tree_container_width_txt.length-2 );
	const tree_container_height_txt = tree_container_props.height;
	const tree_container_height = tree_container_height_txt.substring( 0, tree_container_height_txt.length-2 );
	myDraggable.left = 100;
	myDraggable.top = 100;
	
	const rootIndex = myTree.push({
		node: newNode,
		draggable: myDraggable,
		leaderline: null,
		children: [],
		parentIndex: null,
		depth: 0,
		oldPosition: get_position( newNode )
	}) - 1;
	
	myDraggable.onMove = function(newPositionLT) {
		const newPosition = {
			x: newPositionLT.left,
			y: newPositionLT.top
		}
		const positionDiff = get_position_diff( myTree[rootIndex].oldPosition, newPosition );
		myTree[rootIndex].oldPosition = newPosition;
		redrawLeaderLines( rootIndex, positionDiff );
	}
	
	add_button_reference.onclick = addNode.bind( null, "New Node", rootIndex );
}

function addNodeElements( inHTMLNode, inTextContent ) {
	const delete_button = document.createElement("div");
	delete_button.classList = "delete_button";
	delete_button.innerText = "-";
	inHTMLNode.appendChild( delete_button );
	
	const text_container = document.createElement("div");
	text_container.classList = "text_container";
	text_container.innerText = inTextContent;
	inHTMLNode.appendChild( text_container );
	
	const add_button = document.createElement("div");
	add_button.classList = "add_button";
	add_button.innerText = "+";
	return inHTMLNode.appendChild( add_button );
}

function setDraggablePositionOfChild( inDraggable, inParentPosition ) {
	const pos = get_position( document.getElementById("lens") );
	inDraggable.left = inParentPosition.x + pos.x;
	inDraggable.top = inParentPosition.y + 150 + pos.y;
}

function updateDraggablePosition( Index, PositionDiff ) {
	const draggable = myTree[Index].draggable;
	draggable.left -= PositionDiff.x;
	draggable.top -= PositionDiff.y;
}

function redrawLeaderLines( Index, PositionDiff ) {
	const ref = myTree[Index];
	const node = ref.node;
	const draggable = ref.draggable;
	const children = ref.children;
	const parent = myTree[ref.parentIndex];

	if( parent ) {
		const parent_node = parent.node;
		myTree[Index].leaderline.remove();
		myTree[Index].leaderline = new LeaderLine(
			parent_node,
			node
		);
	}

	if( children.length > 0 ) {
		children.forEach( (childIndex) => {
			updateDraggablePosition( childIndex, PositionDiff );
			redrawLeaderLines( childIndex, PositionDiff );
		});
	}
}

function addNode( text_content, ParentIndex ) {
	//Create references to the parent node's properties.
	const ParentRef = myTree[ParentIndex];
	const ParentNode = ParentRef.node;
	const ParentDraggable = ParentRef.draggable;
	const ParentPosition = get_position(ParentRef.node);
	
	//Create the new node.
	const NewNode = document.createElement("div");
	NewNode.classList = "box";
	
	//Create the elements inside the node, remember the add button for event attachment later.
	const add_button_reference = addNodeElements( NewNode, text_content );
	
	//Append the new node to the HTML dom.
	const tree_container = document.getElementById("lens");
	tree_container.appendChild( NewNode );
	
	//Create a new draggable for the new node.
	const NewDraggable = new PlainDraggable( NewNode );
	
	//Set the position of the draggable.
	setDraggablePositionOfChild( NewDraggable, ParentPosition );
	
	//Create a new leaderline connecting the new node and the parent node.
	let myLeaderLine = new LeaderLine(
		ParentNode,
		NewNode
	);
	
	//Remember this node's HTML element reference, draggable reference, and leaderline reference.
	const NewNodeIndex = myTree.push( {
		node: NewNode,
		draggable: NewDraggable,
		leaderline: myLeaderLine,
		children: [],
		parentIndex: ParentIndex,
		depth: ParentRef.depth+1,
		oldPosition: get_position( NewNode )
	} ) - 1;
	
	//Add a reference to this node to the parent node's list of children.
	myTree[ParentIndex].children.push( NewNodeIndex );
	
	//Attach an on-move event to update the leaderline.
	NewDraggable.onMove = function(newPositionLT) {
		const newPosition = {
			x: newPositionLT.left,
			y: newPositionLT.top
		}
		const positionDiff = get_position_diff( myTree[NewNodeIndex].oldPosition, newPosition );
		myTree[NewNodeIndex].oldPosition = newPosition;
		redrawLeaderLines( NewNodeIndex, positionDiff );
	}
	
	//Attach an event listener to the add button.
	add_button_reference.onclick = addNode.bind( null, "New Node", NewNodeIndex );
}

function update_leaderline_positions() {
	myTree.forEach( (node) => {
		if( node.leaderline ) {
			node.leaderline.position();
		}
	});
}

function get_position( element ) {
	const translate_string = element.style.transform;
	const open_p = translate_string.indexOf("(");
	const first_p = translate_string.indexOf("p");
	const comma = translate_string.indexOf(",");
	const last_p = translate_string.lastIndexOf("p");
	const x_val = translate_string.substring( open_p+1, first_p );
	const y_val = translate_string.substring( comma+1, last_p );
	return {x: Number(x_val), y: Number(y_val)};
}

function get_position_diff( positionA, positionB ) {
	return {
		x: positionA.x - positionB.x,
		y: positionA.y - positionB.y
	};
}

function make_viewport_draggable( viewport ) {
	let is_mouse_down = false;
	viewport.addEventListener( 'mousedown', (click_event) => {
		is_mouse_down = true;
	});
	viewport.addEventListener( 'mousemove', (click_event) => {
		if( is_mouse_down ) {			
			const pos = get_position( viewport );
			const move_x = Number(pos.x) + click_event.movementX;
			const move_y = Number(pos.y) + click_event.movementY;
			
			const transform = 'translate(' + move_x + 'px,' + move_y + 'px)';
			viewport.style.transform = transform;
			
			update_leaderline_positions();
		}
	});
	viewport.addEventListener( 'mouseup', (click_event) => {
		is_mouse_down = false;
	});
	viewport.addEventListener( 'mouseout', (mouse_move_event) => {
		is_mouse_down = false;
	});
}

window.addEventListener( 'load', (loaded_event) => {
	const tree_container = document.getElementById("lens");
	make_viewport_draggable( tree_container );
	
	addRootNode();
	
});