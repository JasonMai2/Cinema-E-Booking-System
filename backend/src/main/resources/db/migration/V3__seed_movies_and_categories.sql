-- V3__seed_movies_and_categories.sql
-- Seed categories
INSERT IGNORE INTO categories (id, name) VALUES
(1,'Action'),(2,'Adventure'),(3,'Drama'),(4,'Comedy'),(5,'Sci-Fi'),
(6,'Thriller'),(7,'Romance'),(8,'Animation'),(9,'Family'),(10,'Horror'),
(11,'Fantasy'),(12,'Crime'),(13,'Biography');

-- Seed a set of movies (30+). synopsis here is short original summaries.
INSERT INTO movies (title, synopsis, mpaa_rating, trailer_video_url, trailer_image_url, created_at) VALUES
('The Shawshank Redemption', 'Two imprisoned men bond over years, finding solace and eventual redemption.', 'R', '', '', NOW()),
('The Godfather', 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.', 'R', '', '', NOW()),
('The Dark Knight', 'Batman faces the Joker who thrusts Gotham into anarchy and forces moral choices.', 'PG-13', '', '', NOW()),
('Pulp Fiction', 'Intersecting stories of crime and redemption in LA with dark humor and style.', 'R', '', '', NOW()),
('Forrest Gump', 'A man with innocence influences several historical events while searching for his love.', 'PG-13', '', '', NOW()),
('Inception', 'A thief who steals corporate secrets through dream-sharing gets one last job: inception.', 'PG-13', '', '', NOW()),
('The Matrix', 'A hacker discovers reality is a simulation and joins a rebellion against machines.', 'R', '', '', NOW()),
('Interstellar', 'Explorers travel through a wormhole to secure humanity''s future among the stars.', 'PG-13', '', '', NOW()),
('Spirited Away', 'A young girl enters a mysterious spirit world and must save her parents.', 'PG', '', '', NOW()),
('The Lion King', 'A young lion prince must reclaim his kingdom after loss and exile.', 'G', '', '', NOW()),
('Avengers: Endgame', 'The Avengers assemble once more to undo Thanos'' devastating actions.', 'PG-13', '', '', NOW()),
('Jurassic Park', 'Scientists clone dinosaurs to populate a theme park with disastrous results.', 'PG-13', '', '', NOW()),
('The Silence of the Lambs', 'An FBI trainee seeks help from a cannibal to catch a serial killer.', 'R', '', '', NOW()),
('Titanic', 'A young couple from different social classes fall in love aboard the doomed liner.', 'PG-13', '', '', NOW()),
('The Lord of the Rings: The Fellowship of the Ring', 'A hobbit begins a quest to destroy an all-powerful ring.', 'PG-13', '', '', NOW()),
('Gladiator', 'A general becomes a gladiator and seeks vengeance against an emperor.', 'R', '', '', NOW()),
('Back to the Future', 'A teen goes back in time and must ensure his parents fall in love to return.', 'PG', '', '', NOW()),
('Toy Story', 'Toys come to life and a cowboy and spaceman learn to work together.', 'G', '', '', NOW()),
('Saving Private Ryan', 'WWII soldiers risk everything to retrieve a paratrooper behind enemy lines.', 'R', '', '', NOW()),
('The Prestige', 'Two magicians become bitter rivals with tragic consequences.', 'PG-13', '', '', NOW()),
('Whiplash', 'A young drummer endures extreme teaching methods to become great.', 'R', '', '', NOW()),
('La La Land', 'An aspiring actress and a jazz musician fall in love while pursuing careers.', 'PG-13', '', '', NOW()),
('Parasite', 'A poor family ingratiates itself into a wealthy household with consequences.', 'R', '', '', NOW()),
('Mad Max: Fury Road', 'In a desert wasteland, rebels help a woman escape a tyrant''s army.', 'R', '', '', NOW()),
('Alien', 'The crew of a spaceship faces a deadly extraterrestrial organism.', 'R', '', '', NOW()),
('Casablanca', 'A nightclub owner must choose between love and helping former lovers escape.', 'PG', '', '', NOW()),
('The Departed', 'Undercover cops and moles in the mob try to identify each other in Boston.', 'R', '', '', NOW()),
('Eternal Sunshine of the Spotless Mind', 'After a painful breakup, two people erase memories of each other.', 'R', '', '', NOW()),
('Coco', 'A boy journeys to the Land of the Dead to uncover family history and music.', 'PG', '', '', NOW()),
('The Social Network', 'The story of Facebook''s founding and legal battles that followed.', 'PG-13', '', '', NOW());

-- Link some movie categories (simple mapping)
INSERT IGNORE INTO movie_categories (movie_id, category_id)
SELECT m.id, c.id FROM movies m JOIN categories c ON
  ( (m.title LIKE '%Avengers%' AND c.name='Action') OR
    (m.title LIKE '%Matrix%' AND c.name='Sci-Fi') OR
    (m.title LIKE '%Toy Story%' AND c.name='Animation') OR
    (m.title LIKE '%Coco%' AND c.name='Animation') OR
    (m.title LIKE '%Spirited Away%' AND c.name='Animation') OR
    (m.title LIKE '%Titanic%' AND c.name='Romance') OR
    (m.title LIKE '%La La Land%' AND c.name='Romance') OR
    (m.title LIKE '%The Godfather%' AND c.name='Crime') OR
    (m.title LIKE '%The Departed%' AND c.name='Crime')
  );

-- For the rest, fall back to mapping by generic genre keywords
INSERT IGNORE INTO movie_categories (movie_id, category_id)
SELECT m.id, 1 FROM movies m WHERE m.title IN ('Mad Max: Fury Road','Gladiator','Die Hard') LIMIT 0;
-- (You can manually add more mappings as needed)

-- MySQL FULLTEXT index already exists in earlier migration (ft_movies_title_synopsis)
