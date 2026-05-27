# guegan

cd frontend
npm install 
npm run dev

cd backend
npm install 
npm run dev

git add .
git commit -m "modifications"

git push



cd ~/guegan/frontend 
git pull 
npm run build 
pm2 restart guegan-frontend 
cd ~/guegan/backend 
git pull 
pm2 restart guegan-backend