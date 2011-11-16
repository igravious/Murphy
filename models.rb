
module Nuclear::Models
  class Pile < Base
    has_many :rods
    has_many :assemblies, :through => :rods
  end
  
  class Assembly < Base
    has_many :rods
  end
    
  class Rod < Base
    belongs_to :pile
    belongs_to :assembly
  end
  
  class BootStrap < V 0.1
    def self.up
      create_table Pile.table_name do |t|
        t.integer :inode
        t.string :owner, :limit => 64 
        t.timestamps
      end
    end
    def self.down
      drop_table Pile.table_name
    end
  end
  
  class RegisterCore < V 0.2
    def self.up
      p = Pile.new
      s = File.stat CORE
      p.inode = s.ino
      p.save!
    end
    def self.down
    end
  end
  
  class ToolBox < V 0.3
    def self.up
      create_table Assembly.table_name do |t|
        t.string :object
      end
      create_table Rod.table_name do |t|
        t.string :json
        t.references :pile
        t.references :assembly
      end
    end
    def self.down
      drop_table Rod.table_name
    end
    def self.down
      drop_table Assembly.table_name
    end
  end
  
  class PowerUp < V 0.4
    def self.up
      a = Assembly.new
      a.object = 'toolbox'
      a.save!
    end
  end
  
  class SeeThrough < V 0.5
    def self.up
      add_column Assembly.table_name, :see_through, :boolean, :default => 0
      Assembly.reset_column_information
      a = Assembly.where(:object => 'toolbox').first
      a.see_through = true
      a.save!
    end
  end
  
  class Div < V 0.6
    def self.up
      a = Assembly.new
      a.object = 'div'
      a.save! 
    end
  end
  
  class Property < V 0.7
    def self.up
      a = Assembly.new
      a.object = 'property'
      a.see_through = true
      a.save! 
    end
  end

  class Inspector < V 0.8
    def self.up
      a = Assembly.new
      a.object = 'inspector'
      a.see_through = true
      a.save! 
    end
  end
end
