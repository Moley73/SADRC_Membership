import { Container, Typography, Box, Link, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const resources = [
  {
    name: 'SADRC Constitution - UPDATED (April 2025)',
    file: '/pdfs/SADRC%20Constitution%20-%20UPDATED%20(April%202025).pdf',
    description: 'The latest club constitution document.'
  },
  {
    name: 'SADRC Membership Form 2025-26',
    file: '/pdfs/SADRC%20membership%20form%202025-26%20-%20Final.pdf',
    description: 'Membership application form for 2025-26.'
  },
  {
    name: 'Codes of Conduct (Senior Athletes)',
    file: '/pdfs/codes-of-conduct-senior-athletes-1%20(1).pdf',
    description: 'Codes of conduct for senior athletes.'
  }
];

export default function Resources() {
  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 700, textAlign: 'center', mb: 3 }}>
        Club Resources & Documents
      </Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <List>
          {resources.map((r) => (
            <ListItem key={r.file} divider>
              <ListItemIcon>
                <PictureAsPdfIcon color="error" fontSize="large" />
              </ListItemIcon>
              <ListItemText
                primary={<Link href={r.file} target="_blank" rel="noopener" underline="hover" sx={{ fontWeight: 600, fontSize: 18 }}>{r.name}</Link>}
                secondary={r.description}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}
