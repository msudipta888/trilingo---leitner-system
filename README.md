# Flashcard Learning System

A **Flashcard Learning System** designed to help users memorize and revise information effectively. This project enables users to create, manage, and study flashcards interactively.

## Features

- **Create Flashcards:** Users can add new flashcards with questions and answers.
- **Edit & Delete:** Modify or remove flashcards as needed.
- **Categorization:** Organize flashcards into different categories for structured learning.
- **Quiz Mode:** Test knowledge with randomized flashcards.
- **Progress Tracking:** Keep track of learned and unlearned flashcards.
- **Responsive Design:** Works seamlessly on desktop and mobile devices.

## Tech Stack

- **Frontend:** React.js, Tailwind CSS (or Material-UI)
- **Backend:** Node.js, Express.js
- **Database:** MySQL (or PostgreSQL, MongoDB)
- **State Management:** Redux (if applicable)
- **Authentication:** JWT-based authentication (if implemented)

## Installation

### Prerequisites

- Node.js and npm/yarn installed
- MongoDB database setup

### Steps to Run Locally

1. Clone the repository:

   ```sh
   git clone https://github.com/your-username/flashcard-learning-system.git
   cd flashcard-learning-system
   ```

2. Install dependencies:

   ```sh
   npm install
   # or
   yarn install
   ```

3. Set up the database:

   - Create a new database in MySQL/PostgreSQL.
   - Run the migration script if applicable.

4. Configure environment variables:
   Create a `.env` file in the root directory and add the following:

   ```env
   DATABASE_URL=your_database_url
   JWT_SECRET=your_secret_key
   ```

5. Start the backend server:

   ```sh
   npm run start
   ```

6. Start the frontend:

   ```sh
   npm run dev
   ```

7. Open `http://localhost:3000` in your browser to use the application.

## API Endpoints

| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| POST   | /api/auth/register   | Register a new user    |
| POST   | /api/auth/login      | User login             |
| GET    | /api/flashcards      | Get all flashcards     |
| POST   | /api/flashcards      | Create a new flashcard |
| PUT    | /api/flashcards/\:id | Update a flashcard     |
| DELETE | /api/flashcards/\:id | Delete a flashcard     |

## Contribution

Contributions are welcome! Feel free to fork the repo and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For any queries or suggestions, feel free to reach out at [your-email@example.com](mailto\:msudipta857@gmail.com).

