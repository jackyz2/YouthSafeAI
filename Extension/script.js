const supabaseUrl = '[YOUR_SUPABASE_URL]'
const supabaseKey = '[YOUR_SUPABASE_KEY]'
const supabase_client = supabase.createClient(supabaseUrl, supabaseKey)

document.getElementById('login-form').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent the form from submitting

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Mock login logic
  if (username && password) {
    // remove login form
    document.getElementById('login-form').remove();
    document.getElementById('login-title').textContent = `Welcome back, ${username}! Please select a child to continue`;
    // Store username and login state in localStorage
    localStorage.setItem('username', username);
    localStorage.setItem('isLoggedIn', 'true');

    document.getElementById('message').textContent = 'Login successful!';
    document.getElementById('message').style.color = 'green';

    let children_info = []
    get_children_info(username).then(data => {
      children_info = data.map(child => ({
        name: child.children.username,
        age: child.children.user_age
      }));
      
      // Clear previous buttons
      const messageElement = document.getElementById('message');
      messageElement.textContent = ''; // Clear existing text content

      // Create a button for each child
      children_info.forEach(child => {
        const nameTagGroup = document.createElement('div');
        nameTagGroup.className = 'button-name-tag-group';

        const button = document.createElement('button');
        button.textContent = child.name + ` (Age: ${child.age})`;
        button.addEventListener('click', () => {
          alert(`Button for ${child.name} clicked!`);
        });

        // Create another button within the group
        const anotherButton = document.createElement('button');
        anotherButton.textContent = `Another action for ${child.name}`;
        anotherButton.addEventListener('click', () => {
          alert(`Another button for ${child.name} clicked!`);
        });

        nameTagGroup.appendChild(button);
        // nameTagGroup.appendChild(anotherButton); // Append the new button to the group
        messageElement.appendChild(nameTagGroup);
      });
    })
  } else {
    document.getElementById('message').textContent = 'Please enter both username and password.';
    document.getElementById('message').style.color = 'red';
  }
});

// Check login state on page load
window.addEventListener('load', function () {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const username = localStorage.getItem('username');

  if (isLoggedIn === 'true' && username) {
    document.getElementById('login-form').remove();
    document.getElementById('login-title').textContent = `Welcome back, ${username}! Please select a child to continue`;

    document.getElementById('message').textContent = `Welcome back, ${username}!`;
    document.getElementById('message').style.color = 'green';

    let children_info = []
    get_children_info(username).then(data => {
      children_info = data.map(child => ({
        name: child.children.username,
        age: child.children.user_age
      }));
      
      // Clear previous buttons
      const messageElement = document.getElementById('message');
      messageElement.textContent = ''; // Clear existing text content

      // Create a button for each child
      children_info.forEach(child => {
        const nameTagGroup = document.createElement('div');
        nameTagGroup.className = 'button-name-tag-group';

        const button = document.createElement('button');
        button.textContent = child.name + ` (Age: ${child.age})`;
        button.addEventListener('click', () => {
          alert(`Button for ${child.name} clicked!`);
        });

        // Create another button within the group
        const anotherButton = document.createElement('button');
        anotherButton.textContent = `Another action for ${child.name}`;
        anotherButton.addEventListener('click', () => {
          alert(`Another button for ${child.name} clicked!`);
        });

        nameTagGroup.appendChild(button);
        // nameTagGroup.appendChild(anotherButton); // Append the new button to the group
        messageElement.appendChild(nameTagGroup);
      });
    })
  }
});


async function get_children_info(username) {
  let { data, error } = await supabase_client
    .from('parent_child_relations')
    .select(`*, users:parent_user_id (username, role, user_age), children:child_user_id (username, role, user_age)`)
    .eq('parent_user_id', 1);

  if (error) {
    console.error(error.message)
    return null
  }
  else return data
}